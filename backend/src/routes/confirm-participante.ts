import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { ClientError } from "../erros/client-erros";
import { env } from "../env";

export async function confirmParticipante(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/participantes/:participanteId/confirm', {
        schema: {
            params: z.object({
                participanteId: z.string().uuid()
            })
        }
    }, async (request, reply) => {

        const { participanteId } = request.params

        const participante = await prisma.participantes.findUnique({
            where: {
                id: participanteId
            }
        })

        if(!participante){
            throw new ClientError('Participante não encontrado.')
        }

        if(participante.is_confirmed){
            return reply.redirect(`${env.WEB_BASE_URL}/trips/${participante.trip_id}`)
        }

        await prisma.participantes.update({
            where: { id: participanteId },
            data: { is_confirmed: true }
        })

        return reply.redirect(`${env.WEB_BASE_URL}/trips/${participante.trip_id}`)
    })
} 