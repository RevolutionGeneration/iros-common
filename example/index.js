import {express} from 'iros-common';

// config should be imported before importing any other file
import config from './config';

//import config helpers
import {configureLogger, configureAuth, configureApp, configureServices, configureMongoose, authApi, mailService, logger, validate, joi as Joi} from 'iros-common';

// init logs
configureLogger();

// init auth
configureAuth(config);

/*
 * init database
 * configureMongoose(config);
 */

// init services
configureServices(config.service, config.app);

// configure routes
const router = express.Router();

// validation
router.post(
    '/validation',
    validate({
        body: {
            str: Joi.string().required(),
            obj: Joi.object()
                .keys({
                    int: Joi.number().required(),
                })
                .required(),
            plain_obj: {
                bool: Joi.bool().required(),
            },
            date: Joi.alternatives().conditional('str', {'switch':
                  [
                      {is: 'before',
                          then: Joi.date()
                              .max('now')
                              .messages({'date.max': 'must be before today'})
                              .required()},
                      {is: 'after',
                          then: Joi.date()
                              .min('now')
                              .messages({'date.min': 'must be after today'})
                              .required()}
                  ]})
                .required()
        },
    }),
    (req, res) => res.json({valid: true}),
);

router.get(
    '/auth-only',
    // api authentication
    authApi,
    (req, res) => res.json({}),
);
router.post(
    '/send-mail',
    // service usage
    () => mailService.send({
        sender: 'test@domain.com',
        from: 'Test ACC <test@domain.com>',
        to: 'example@domain.com',
        subject: 'sample email',
        html: '<div>Hello World</div>',
        text: 'hello world',
    }),
);

// init app
const app = configureApp(router);

/*
 * module.parent check is required to support mocha watch
 * src: https://github.com/mochajs/mocha/issues/1912
 */
if (!module.parent) {
    // listen on port config.port
    app.listen(config.port, () => {
        logger.info(`server started on port ${config.port} (${config.env})`);
    });
}

//configure workers
/*
 *import {Worker} from 'iros-common';
 *const worker = new Worker({
 *  maxWorkers: 1,
 *  tasks: {
 *    runEverySecond: {
 *      module: `${__dirname}/task`,
 *      command: 'run',
 *      interval: 1000,
 *    },
 *  },
 *});
 */

//configure workflow
/*
 *import {Workflow, WorkflowStep} from 'iros-common';
 *
 *const steps = [
 *  new WorkflowStep({state: 'A', next: 'B', fn: context => Promise.resolve(context)}),
 *  new WorkflowStep({state: 'B', fn: context => Promise.resolve({...context, next: 'C'})}),
 *  new WorkflowStep({state: 'C', next: 'D', fn: context => Promise.resolve(context)}),
 *];
 *const workflow = new Workflow(steps)
 */

export default app;
