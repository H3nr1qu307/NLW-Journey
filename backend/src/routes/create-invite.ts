import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { getMailClient } from "../lib/mail";
import { dayjs } from "../lib/dayjs";
import nodemailer from 'nodemailer'
import { ClientError } from "../erros/client-erros";
import { env } from "../env";

export async function createInvite(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/invites', {
        schema: {
            params: z.object({
                tripId: z.string().uuid()
            }),
            body: z.object({
                email: z.string().email()
            })
        }
    }, async (request) => {
        const { tripId } = request.params
        const { email } = request.body;

        const trip = await prisma.trip.findUnique({
            where: { id: tripId }
        })

        if(!trip){
            throw new ClientError('Viagem não encontrada.')
        }

        const participante = await prisma.participantes.create({
            data: {
                email,
                trip_id: tripId
            }
        })

        const formataDatainicio = dayjs(trip.inicio_viagem).format('LL')
        const formataDataFim = dayjs(trip.fim_viagem).format('LL')

        const mail = await getMailClient()

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

        return { participanteId: participante.id }
    })
}