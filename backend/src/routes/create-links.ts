import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { ClientError } from "../erros/client-erros";

export async function createLink(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/links', {
        schema: {
            params: z.object({
                tripId: z.string().uuid()
            }),
            body: z.object({
                titulo: z.string().min(4),
                url: z.string().url(),
            })
        }
    }, async (request) => {
        const { tripId } = request.params
        const { titulo, url } = request.body;

        const trip = await prisma.trip.findUnique({
            where: { id: tripId }
        })

        if(!trip){
            throw new ClientError('Viagem não encontrada.')
        }

        const link = await prisma.link.create({
            data: {
                titulo, 
                url, 
                trip_id: tripId
            }
        })

        return { linkId: trip.id }
    })
}