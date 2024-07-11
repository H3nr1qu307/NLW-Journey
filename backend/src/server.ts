import fastify from 'fastify'
import cors from '@fastify/cors'
import { createTrip } from './routes/create-trip'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { confirmTrip } from './routes/confirm-trip';
import { confirmParticipante } from './routes/confirm-participante';
import { createAtividade } from './routes/create-atividades';
import { getAtividades } from './routes/get-atividades';
import { createLink } from './routes/create-links';
import { getLinks } from './routes/get-links';
import { getParticipantess } from './routes/get-participantes';
import { createInvite } from './routes/create-invite';
import { updateTrip } from './routes/update-trip';
import { getTrips } from './routes/get-trip-details';
import { getParticipante } from './routes/get-participante';
import { errorhandler } from './error-dandler';
import { env } from './env';

const app = fastify()

app.register(cors, {
    origin: '*'
})

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.setErrorHandler(errorhandler)

app.register(createTrip)
app.register(confirmTrip)
app.register(updateTrip)
app.register(getTrips)
app.register(confirmParticipante)
app.register(getParticipantess)
app.register(getParticipante)
app.register(createInvite)
app.register(createAtividade)
app.register(getAtividades)
app.register(createLink)
app.register(getLinks)

app.listen({ port: env.PORT }).then(() => console.log("Server rodando!"))