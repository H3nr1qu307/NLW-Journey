import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod'
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'
import { ClientError } from "../erros/client-erros";
import { env } from "../env";

export async function confirmTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/confirm', {
        schema: {
            params: z.object({
                tripId: z.string().uuid()
            })
        }
    }, async (request, reply) => {

        const { tripId } = request.params

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId
            },
            include: {
                participantes: {
                    where: {
                        is_dono: false
                    }
                }
            }
        })

        if(!trip){
            throw new ClientError("Viagem não existente.")
        }

        if(trip.is_confirmed){
            return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)
        }

        await prisma.trip.update({
            where: { id: tripId },
            data: { is_confirmed: true }
        })

        const formataDatainicio = dayjs(trip.inicio_viagem).format('LL')
        const formataDataFim = dayjs(trip.fim_viagem).format('LL')

        const mail = await getMailClient()

        await Promise.all(
            trip.participantes.map(async (participante) => {
                const linkConfirmacao = `${env.API_BASE_URL}/participantes/${participante.id}/confirm`

                const message = await mail.sendMail({
                    from: {
                        name: 'Equipe plann.er',
                        address: 'confirma@plann.er'
                    },
                    to: participante.email,
                    subject: `Confirme sua presença na viagem para ${trip.destino} em ${formataDatainicio}`,
                    html: `
                        <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                            <p>Você foi convidado(a) para participar de uma viagem para <strong>${trip.destino}</strong>, Brasil nas datas <strong>${formataDatainicio}</strong> a <strong>${formataDataFim}</strong>.</p>
                            <p></p>
                            <p>Para confirmar sua presença, clique no link abaixo:</p>
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
            })
        )

        return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)
    })
} 