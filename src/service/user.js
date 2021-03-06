import request from 'request-promise';
import {HttpErrorFactory} from '../errors/http.error';
import _ from 'lodash';
import logger from '../logger/logger';

let service = {};
let app = 'unknown';

function send(options) {

    // Prepend JWT if we receive plain auth token
    if (
        options.headers &&
      options.headers.authorization &&
      !options.headers.authorization.match(/^bearer /i) &&
      !options.headers.authorization.match(/^jwt /i)
    ) {
        options.headers.authorization = `JWT ${options.headers.authorization}`;
    }

    return request(options)
        .then(body => body)
        .catch(r => {
            const message = _.get(r, 'error.message', 'Failed to request User Service'),
                errors = _.get(r, 'error.errors', {}),
                isPublic = r.statusCode !== 500,
                status = r.statusCode || 500;

            return Promise.reject(new HttpErrorFactory({
                message,
                isPublic,
                errors,
                status,
            }));
        });
}

function post(path, data, authorization, override_options = {}) {
    return send({
        ...{
            method: 'POST',
            uri: `${service.url}${path}`,
            body: data,
            json: true,
            headers: {authorization},
        },
        ...override_options,
    });
}

function get(path, data = {}, authorization = null, override_options = {}) {
    return send({
        ...{
            method: 'GET',
            uri: `${service.url}${path}?${Object.keys(data).map((key) => `${key}=${data[key]}`)
                .join('&')}`,
            json: true,
            headers: {authorization},
        },
        ...override_options,
    });
}

const configure = (config, app_name) => {
    service = config.user;
    app = app_name;

    post('/app/settings', {
        app,
        sections: service.sections
    }, `bearer ${service.key}`).catch(e => {
        logger.error('failed to setup app and sections on user service', {e});
    });
};

function login(email, password) {
    return post('/auth/password', {
        email,
        password,
    });
}

function canAccess(jwt, role = 'user', section = null) {
    return get('/user/can-access', {
        app,
        section,
        role,
    }, jwt);
}

function do_delete(path, data = {}, authorization = null, override_options = {}) {
    return send({
        ...{
            method: 'DELETE',
            uri: `${service.url}${path}`,
            body: data,
            json: true,
            headers: {authorization},

        },
        ...override_options,
    });
}

function requestPasswordReset(email) {
    return post('/auth/password/request-reset', {email});
}

function resetPassword(email, token, password) {
    return post('/auth/password/reset', {
        email,
        token,
        password,
    });
}

function getUsers(jwt, company = undefined) {
    return get('/user/all', {company}, jwt);
}

function createUser(email, jwt, company = undefined) {
    return post('/user', {
        email,
        company,
    }, jwt);
}

function deleteRole(email, role, section, jwt) {
    const data = {
        email,
        app,
        role,
    };
    if (section) {
        data.section = section;
    }

    return do_delete('/user/role', data, jwt);
}

function deleteUser(email, jwt) {
    return get('/user', {email}, jwt)
        .then(user => {
            const roles = user.roles.filter(role => role.app === app);

            return Promise.all(roles.map(role => deleteRole(user.email, role.role, role.section, jwt)))
                .then(result => result[result.length - 1]);
        });
}

function foreDeleteUser(email, jwt) {
    const data = {
        email,
        app,
    };

    return do_delete('/user', data, jwt);
}

function addRole(email, role, section, jwt) {
    const data = {
        email,
        app,
        role,
        section,
    };

    return post('/user/role', data, jwt);
}

export default {
    login,
    canAccess,
    requestPasswordReset,
    resetPassword,
    getUsers,
    createUser,
    addRole,
    deleteRole,
    deleteUser,
    foreDeleteUser,
    configure,
};
