import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { ClientError } from "../erros/client-erros";

export async function updateTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().put('/trips/:tripId', {
        schema: {
            params: z.object({
                tripId: z.string().uuid()
            }),
            body: z.object({
                destino: z.string().min(4),
                inicio_viagem: z.coerce.date(),
                fim_viagem: z.coerce.date()
            })
        }
    }, async (request) => {
        const { destino, inicio_viagem, fim_viagem } = request.body;
        const { tripId } = request.params

        const trip = await prisma.trip.findUnique({
            where: { id: tripId }
        })

        if(!trip){
            throw new ClientError('Viagem não encontrada.')
        }

        if(dayjs(inicio_viagem).isBefore(new Date())){
            throw new ClientError("Data de início da viagem inválida.")
        }

        if(dayjs(fim_viagem).isBefore(inicio_viagem)){
            throw new ClientError('Data de fim da viagem inválida.')
        }

        await prisma.trip.update({
            where: { id: tripId },
            data: {
                destino,
                inicio_viagem,
                fim_viagem
            } 
        })
        
        return { tripId: trip.id }
    })
}