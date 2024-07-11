import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { ClientError } from "../erros/client-erros";

export async function getAtividades(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/atividades', {
        schema: {
            params: z.object({
                tripId: z.string().uuid()
            })
        }
    }, async (request) => {
        const { tripId } = request.params

        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
            include: { 
                atividades: {
                    orderBy: {
                        data_atividade: 'asc'
                    }
                } 
            }
        })

        if(!trip){
            throw new ClientError('Viagem não encontrada.')
        }

        const diferencaEmDiasDoInicioAoFimDaViagem = dayjs(trip.fim_viagem).diff(trip.inicio_viagem, 'days')

        const atividades = Array.from({ length: diferencaEmDiasDoInicioAoFimDaViagem + 1 }).map((_, index) => {
            const data = dayjs(trip.inicio_viagem).add(index, 'days')

            return {
                date: data.toDate(),
                ativisades: trip.atividades.filter(atividade => {
                    return dayjs(atividade.data_atividade).isSame(data, 'day')
                })
            }
        })

        return { atividades }
    })
}