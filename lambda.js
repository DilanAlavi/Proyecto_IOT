const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');
const IotData = new AWS.IotData({endpoint: 'a1vcxnn8t7r7t-ats.iot.us-east-2.amazonaws.com'});
const dynamodb = new AWS.DynamoDB.DocumentClient();
var thingid = "";
const TurnOffParams = {
  thingName: 'smart_trash',
  payload: '{"state": {"desired": {"EcoTrash": 0}}}',
};

const TurnOnParams = {
  thingName: 'smart_trash',
  payload: '{"state": {"desired": {"EcoTrash": 1}}}',
};

const ShadowParams = {
    thingName: 'smart_trash',  
};
var ChangeIDParams = {
      topic: '$aws/things/smart_trash/shadow/update',
     payload: '{"state": {"desired": {"objectid": "' + thingid + '"}}}',
 };
 async function saveData(thingid) {
const params = {
TableName: 'BasureroDB',
Item: {
    id: thingid,
    data: thingid
}
};
try {
await dynamodb.put(params).promise();
} catch (error) {
console.error('Error al guardar datos en DynamoDB:', error);
throw error;
}
}

// Función para eliminar datos de DynamoDB
async function deleteData(idData) {
const params = {
TableName: 'BasureroDB',
Key: {
    id: idData
}
};
try {
await dynamodb.delete(params).promise();
console.log('Deleted.');
} catch (error) {
console.error('Error al eliminar datos de DynamoDB:', error);
throw error;
}
}

// Función para obtener datos de DynamoDB
async function getDataFromDB(idData) {
const params = {
TableName: 'BasureroDB',
Key: {
    id: idData
}
};
try {
const result = await dynamodb.get(params).promise();
return result.Item.data;
} catch (error) {
console.error('Error al obtener datos de DynamoDB:', error);
throw error;
}
}

// Función para obtener todos los datos de DynamoDB
async function getAllFromDb() {
const params = {
TableName: 'BasureroDB'
};
try {
const list = await dynamodb.scan(params).promise();
return list.Items;
} catch (error) {
console.error('Error al obtener todos los datos de DynamoDB:', error);
throw error;
}
}


function getShadowPromise(params) {
    return new Promise((resolve, reject) => {
        IotData.getThingShadow(params, (err, data) => {
            if (err) {
                console.log(err, err.stack);
                reject('Failed to get thing shadow ${err.errorMessage}');
            } else {
                resolve(JSON.parse(data.payload));
            }
        });
    });
}

const LaunchRequestHandler = {
canHandle(handlerInput) {
return handlerInput.requestEnvelope.request.type === "LaunchRequest";
},
async handle(handlerInput) {
// Obtener el objectid del dispositivo IoT
await getShadowPromise(ShadowParams)
    .then((result) => {
        thingid = result.state.desired.objectid;
        // Actualizar el objectid en el estado deseado
        updateShadowId();
    });

const speechText = "Hola " + thingid + "!!";

// Hablar el texto mediante Alexa
return handlerInput.responseBuilder.speak(speechText)
    .reprompt(speechText)
    .getResponse();
}
};




const StateIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StateIntent';
    },
    async handle(handlerInput) {
        var builtInLed = 'unknown';
        await getShadowPromise(ShadowParams).then((result) => builtInLed = result.state.desired.EcoTrash);
        console.log(builtInLed);

        var speakOutput = 'Error';
        if (builtInLed == 0) {
            speakOutput = 'La luz está apagada';
        } else if (builtInLed == 1) {
            speakOutput = 'La luz está encendida';
        } else {
            speakOutput = 'No se pudo consultar el estado de la luz, por favor intente más tarde';
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const TurnOffIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TurnOffIntent';
    },
    handle(handlerInput) {
        var speakOutput = "Error";
        IotData.updateThingShadow(TurnOffParams, function(err, data) {
            if (err) console.log(err);
        });
      
        speakOutput = 'Apagando Basurero!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


const TurnOnIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TurnOnIntent';
    },
    handle(handlerInput) {
        var speakOutput = "Error";
        IotData.updateThingShadow(TurnOnParams, function(err, data) {
            if (err) console.log(err);
        });
      
        speakOutput = 'Encendiendo Basurero!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const AllNamesIntentHandler = {
canHandle(handlerInput) {
return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
    Alexa.getIntentName(handlerInput.requestEnvelope) === 'AllNamesIntent';
},
async handle(handlerInput) {
var speechText = "Algo salió mal, intente de nuevo por favor.";
try {
    const list = await getAllFromDb();
    if (list.length > 0) {
        var listString = "";
        for (var i = 0; i < list.length; i++) {
            listString += list[i].data;
            if (i != list.length - 1) listString += ", ";
        }
        speechText = "La lista de basureros disponibles en el hogar son: " + listString;
    } else {
        speechText = "No existen basureros en el hogar.";
    }
} catch (error) {
    console.error(`Error: ${error.message}`);
}

return handlerInput.responseBuilder
    .speak(speechText)
    .reprompt(speechText)
    .getResponse();
}
};
function updateShadowId() {
ChangeIDParams.payload = '{"state": {"desired": {"objectid": "' + thingid + '"}}}';
IotData.publish(ChangeIDParams, function(err, data) {
if(err) console.log("Error añadir perro: " + err);
});
}
const ChangeIdIntentHandler = {
canHandle(handlerInput) {
return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
    Alexa.getIntentName(handlerInput.requestEnvelope) === 'ChangeIdIntent';
},
async handle(handlerInput) {
var speechText = "No se pudo encontrar a este basurero, intenta de nuevo";
try {
    const objectId = handlerInput.requestEnvelope.request.intent.slots.ObjectId.value;
    var data = await getDataFromDB(objectId);
    if (data != null) {
        thingid = data;
        updateShadowId();
        speechText = "Se cambió a " + data + " con éxito";
    }
} catch (error) {
    console.error(`Error: ${error.message}`);
}

return handlerInput.responseBuilder
    .speak(speechText)
    .reprompt(speechText)
    .getResponse();
}
};



const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Tienes tres opciones, encender, apagar, y preguntar cual es el estado.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Adiós!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        StateIntentHandler,
        TurnOffIntentHandler,
        TurnOnIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        AllNamesIntentHandler,
        ChangeIdIntentHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();