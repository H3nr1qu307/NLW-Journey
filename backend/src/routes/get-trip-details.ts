import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { ClientError } from "../erros/client-erros";

export async function getTrips(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId', {
        schema: {
            params: z.object({
                tripId: z.string().uuid()
            })
        }
    }, async (request) => {
        const { tripId } = request.params

        const trip = await prisma.trip.findUnique({
            select: {
                id: true,
                destino: true,
                inicio_viagem: true,
                fim_viagem: true,
                is_confirmed: true
            },
            where: { id: tripId }
        })

        if(!trip){
            throw new ClientError('Viagem não encontrada.')
        }

        return { trip }
    })
}