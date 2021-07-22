const jwt = require('jsonwebtoken');
const log = require('bunyan-tree').fork({component: 'lib/app'});
const axios = require('axios');

const list_patients = 'list_patients';
const delete_patient = 'delete_patient';
const view_patient = 'view_patient';
const edit_patient_informations = 'edit_patient_informations';
const list_no_activated_accounts = 'list_no_activated_accounts';
const delete_no_activated_account = 'delete_no_activated_account';

/**
 * Check if the user has the necessary role to do the action
 * @param {String} token Token of the user
 * @param {String} role Necessary role
 * @return {Boolean} The user has autorization to do action or not
 */
function hasAutorization(token, role) {
  console.log("HAS AUTH ??")
  const partsOfToken = token.split('.');
  const content = JSON.parse(Buffer.from(partsOfToken[1], 'base64').toString());
  const appRoles = content.realm_access.roles;
  console.log(role)
  console.log(appRoles)
  return appRoles.includes(role);
}

/**
 * Check validation of a Keycloak token
 */
async function checkValidationToken(token, keycloak, keycloakRealm) {
  try {
    await axios.get(`${keycloak}/auth/realms/${keycloakRealm}/protocol/openid-connect/userinfo`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return true;
  } catch {
    return false;
  }
}

function isKeycloakToken(token) {
  if (!token) {
    return false;
  }

  const partsOfToken = token.split('.');
  const content = JSON.parse(Buffer.from(partsOfToken[1], 'base64').toString());
  return content && content.azp === 'admins-backend';
}

/**
 * Check if the request is allowed for this admin user
 * @param {String} token Token of the user
 * @param {String} operationId Request
 * @param {Object} pluginContext pluginContext
 *
 */
async function checkAdminHasRight(token, operationId, pluginContext) {
  const id = pluginContext.req.url.split('/')[pluginContext.req.url.split('/').length - 1];
  const {mongo} = pluginContext.req.controllerData;

  switch (operationId) {
    case 'checkMail':
    case 'setUserFromCode':
    case 'newPassword':
    case 'modifyPassword':
    case 'resetPassword':
    case 'resendMail':
    case 'resendMailFromUserID':
    case 'checkActivationCode':
    case 'getUserByToken':
    case 'createUser':
    case 'activateUser':
      return true;
    case 'getUser':
      return hasAutorization(token, view_patient);
    case 'modifyUser':
      return hasAutorization(token, edit_patient_informations);
    case 'deleteMany':
      return hasAutorization(token, delete_no_activated_account);
    case 'deleteUser':
      const user = await mongo.collections.users.findOne({_id: new mongo.ObjectID(id)});
      if (user) {
        if (user.activated) {
          return hasAutorization(token, delete_patient);
        }

        return hasAutorization(token, delete_no_activated_account);
      }

      return false;
    case 'listHospitalUsers':
      return hasAutorization(token, list_patients);
    case 'listHospitalNoActivatedUsers':
      return hasAutorization(token, list_no_activated_accounts);
    default:
      return false;
  }
}

const bearerAuthenticator = (privkey, config) => async pluginContext => {
  const {authorization: token} = pluginContext.req.headers;
  const {operationId} = pluginContext.api.operationObject;
  const id = pluginContext.req.url.split('/')[pluginContext.req.url.split('/').length - 1];

  if (isKeycloakToken(token)) {
    if (!await checkValidationToken(token, config.keycloak, config.keycloakRealm)) {
      //return refuse('Bad Keycloak token');
    }

    // Admin case
    if (await checkAdminHasRight(token, operationId, pluginContext)) {
      return authorize('admin', id);
    }

    refuse('Not authorized');
  } else {
    // Patient case
    if (!token) {
      return {type: 'invalid', statusCode: 401, message: 'Missing authorization header'};
    }

    const {id, role} = await jwt.verify((token || ''), privkey);
    if (!id || !role) {
      return {type: 'invalid', statusCode: 401, message: 'The JWT must contain the id and role'};
    }

    try {
      switch (operationId) {
        case 'getUser':
        case 'checkMail':
        case 'checkActivationCode':
        case 'setUserFromCode':
        case 'newPassword':
        case 'modifyUser':
        case 'modifyPassword':
        case 'resetPassword':
        case 'resendMail':
        case 'resendMailFromUserID':
        case 'getUserByToken':
        case 'listHospitalUsers':
        case 'deleteUser':
          return (role === 'user' || role === 'admin') ? authorize(role, id) : refuse('bad role');
        default:
          return refuse('request not available');
      }
    } catch (error) {
      log.warn(error);
      refuse();
    }
  }
};

function authorize(role, id) {
  return {type: 'success', role, id};
}

function refuse(err) {
  log.warn(err);
  return {type: 'invalid', statusCode: 401, message: 'Not authorized'};
}

module.exports = {
  bearerAuthenticator
};
