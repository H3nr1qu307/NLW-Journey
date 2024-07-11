import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { prisma } from "../lib/prisma";
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'
import { dayjs } from "../lib/dayjs";
import { ClientError } from "../erros/client-erros";
import { env } from "../env";

export async function createTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips', {
        schema: {
            body: z.object({
                destino: z.string().min(4),
                inicio_viagem: z.coerce.date(),
                fim_viagem: z.coerce.date(),
                dono_nome: z.string(),
                dono_email: z.string().email(),
                email_to_envite: z.array(z.string().email())
            })
        }
    }, async (request) => {
        const { destino, inicio_viagem, fim_viagem, dono_nome, dono_email, email_to_envite } = request.body;

        if(dayjs(inicio_viagem).isBefore(new Date())){
            throw new ClientError("Data de início da viagem inválida.")
        }

        if(dayjs(fim_viagem).isBefore(inicio_viagem)){
            throw new ClientError('Data de fim da viagem inválida.')
        }

        const trip = await prisma.trip.create({
            data: {
                destino, 
                inicio_viagem, 
                fim_viagem,
                participantes: {
                    createMany: {
                        data: [
                            {
                                name: dono_nome,
                                email: dono_email,
                                is_dono: true,
                                is_confirmed: true
                            },
                            ...email_to_envite.map(email => { 
                                return { email }
                            })
                        ]
                    }
                }
            }
        })

        const formataDatainicio = dayjs(inicio_viagem).format('LL')
        const formataDataFim = dayjs(fim_viagem).format('LL')

        const linkConfirmacao = `${env.API_BASE_URL}/trips/${trip.id}/confirm`

        const mail = await getMailClient()

        const message = await mail.sendMail({
            from: {
                name: 'Equipe plann.er',
                address: 'confirma@plann.er'
            },
            to: {
                name: dono_nome,
                address: dono_email
            },
            subject: `Confirme sua viagem para ${destino} em ${formataDatainicio}`,
            html: `
                <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                    <p>Você solicitou a criação de uma viagem para <strong>${destino}</strong>, Brasil nas datas <strong>${formataDatainicio}</strong> a <strong>${formataDataFim}</strong>.</p>
                    <p></p>
                    <p>Para confirmar sua viagem, clique no link abaixo:</p>
                    <p></p>
                    <p>
                        <a href="${linkConfirmacao}">Confirmar viagem</a>
                    </p>
                    <p></p>
                    <p>Caso não saiba do que se trata esse e-mail, apenas o ignore.</p>
                </div>
            `.trim()
        })

        console.log(nodemailer.getTestMessageUrl(message))

        return { tripId: trip.id }
    })
}