import type { FastifyInstance } from "fastify"
import { ClientError } from "./erros/client-erros"
import { ZodError } from "zod"

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorhandler: FastifyErrorHandler = (error, request, reply) => {
    if(error instanceof ZodError){
        return reply.status(400).send({
            message: 'Invalid input.',
            errors: error.flatten().fieldErrors
        })
    }

    if(error instanceof ClientError) {
        return reply.status(400).send({
            message: error.message
        })
    }

    return reply.status(500).send({ message: 'Erro interno no servidor.' })
}
//25:57