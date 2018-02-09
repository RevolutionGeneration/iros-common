import Joi from 'joi';

const getServiceUrl = (service) => `${service.toUpperCase()}_URL`,
    getServiceKey = (service) => `${service.toUpperCase()}_KEY`;

const schema = {
  api: {
    API_KEY: Joi.string().required(),
  },
};

const services = ['lookup', 'mail', 'ogi', 'text', 'tinyurl', 'user'];
for (const s in services) {
  if (services.hasOwnProperty(s)) {
    // add to schema
    schema[s] = {};
    schema[s][getServiceUrl(s)] = Joi.string().required();
    schema[s][getServiceKey(s)] = Joi.string().required();
  }
}
export {schema};

const config = (service, envVars = {}) => {
  const out = {};

  if (schema[getServiceUrl(service)]) {
    out.url = envVars[getServiceUrl(service)];
  }

  if (schema[getServiceKey(service)]) {
    out.key = envVars[getServiceKey(service)];
  }

  return out;
};

export default config;
