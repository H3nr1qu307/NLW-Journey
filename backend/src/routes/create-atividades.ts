import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { ClientError } from "../erros/client-erros";

export async function createAtividade(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/atividades', {
        schema: {
            params: z.object({
                tripId: z.string().uuid()
            }),
            body: z.object({
                titulo: z.string().min(4),
                data_atividade: z.coerce.date(),
            })
        }
    }, async (request) => {
        const { tripId } = request.params
        const { titulo, data_atividade } = request.body;

        const trip = await prisma.trip.findUnique({
            where: { id: tripId }
        })

        if(!trip){
            throw new ClientError('Viagem não encontrada.')
        }

        if (dayjs(data_atividade).isBefore(trip.inicio_viagem)){
            throw new ClientError('A data da atividade é inválida.')
        } 
        
        if (dayjs(data_atividade).isAfter(trip.fim_viagem)){
            throw new ClientError('A data da atividade é inválida.')
        } 

        const atividade = await prisma.atividade.create({
            data: {
                titulo, 
                data_atividade, 
                trip_id: tripId
            }
        })

        return { atividadeId: trip.id }
    })
}