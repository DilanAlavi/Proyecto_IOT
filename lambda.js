        const Alexa = require('ask-sdk-core');
        const AWS = require('aws-sdk');
        const IotData = new AWS.IotData({endpoint: 'a1vcxnn8t7r7t-ats.iot.us-east-2.amazonaws.com'});
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        var thingid = "";
        var distance="";
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
        await getShadowPromise(ShadowParams)
            .then((result) => {
                thingid = result.state.desired.objectid;
                updateShadowId();
            });

        const speechText = "Bienvenido al basurero " + thingid + "!!";
        return handlerInput.responseBuilder.speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};
const GetWeightIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetWeightIntent';
    },
    async handle(handlerInput) {
        var weight = 'unknown';
        await getShadowPromise(ShadowParams).then((result) => weight = result.state.reported.weight);
        
        var speakOutput = 'Error';
        if (weight !== 'unknown') {
            speakOutput = `Hay ${weight} gramos de Basura`;
        } else {
            speakOutput = 'No se pudo consultar el peso del basurero, por favor intente más tarde';
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
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
                    speakOutput = 'El basurero está apagada';
                } else if (builtInLed == 1) {
                    speakOutput = 'El basurero está encendido';
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
const ChangeDistanceParams = {
    topic: '$aws/things/smart_trash/shadow/update',
    payload: '{"state": {"desired": {"change_distance": "' + distance + '"}}}',
};

function updateShadowDistance(distance) {
    ChangeDistanceParams.payload = '{"state": {"desired": {"change_distance": "' + distance + '"}}}';
    IotData.publish(ChangeDistanceParams, function(err, data) {
        if (err) console.log("Error changing distance: " + err);
    });
}

const ChangeDistanceIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'ChangeDistanceIntent';
    },
    async handle(handlerInput) {
        const distance = handlerInput.requestEnvelope.request.intent.slots.Distance.value;
        updateShadowDistance(distance);
        const speechText = "Se cambió la distancia a " + distance + " con éxito";

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

        const SessionEndedRequestHandler = {
            canHandle(handlerInput) {
                return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
            },
            handle(handlerInput) {
                console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
                return handlerInput.responseBuilder.getResponse(); 
            }
        };

        const IntentReflectorHandler = {
            canHandle(handlerInput) {
                return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
            },
            handle(handlerInput) {
                const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
                const speakOutput = `You just triggered ${intentName}`;
        
                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .getResponse();
            }
        };

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
                ChangeDistanceIntentHandler,
                GetWeightIntentHandler,
                IntentReflectorHandler)
            .addErrorHandlers(
                ErrorHandler)
            .withCustomUserAgent('sample/hello-world/v1.2')
            .lambda();