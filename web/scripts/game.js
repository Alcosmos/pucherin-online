// 'true' if it must also show alerts and manipulate the board
const isTableMode = true;

// 'true' if player just used the terminal input
var usedTerm = false;

var isOnline = false;
var onlinePlayer = null;
var futureOnlineName = null;
var justSent = false;

var hasStarted = false;
var players = new Map();
var playersCount = 0;
var currentPlayer = 1;
var dice1Value = 0;
var dice2Value = 0;
var dicesValue = 0;

var lastThrow = 0;
var lastThrow1 = 0;
var lastThrow2 = 0;

var isLuckMode = false;

var isBotMode = false;

var isAutoMode = false;
var autoModeId = null;

var tiles = new Map();

function getChipWord(chipCount) {
    return chipCount + ' ' + (chipCount == 1 ? 'ficha' : 'fichas');
}

function getPointWord(chipCount) {
    return chipCount + ' ' + (chipCount == 1 ? 'punto' : 'puntos');
}

function newMatch(matchPlayers) {
    hasStarted = true;
    playersCount = matchPlayers;
    currentPlayer = 0;
    
    isLuckMode = false;
    
    resetTiles();
    
    var chipsPerPlayer = Math.floor(totalChips / playersCount);
    
    players = new Map();
    
    for (var i = 1; i <= playersCount; i++) {
        addPlayer(i, chipsPerPlayer);
    }
    
    if (isBotMode) {
        players.forEach(thisPlayer => {
            thisPlayer.name = 'Bot' + (thisPlayer.id - 1);
        });
        
        players.get(1).name = 'Jugador';
    }
    
    send('Nueva partida iniciada '
                + (playersCount == 1 ? 'en modo individual.' : 'con ' + playersCount + ' ' + 'jugadores.'));
    
    send('Cada jugador comienza con ' + chipsPerPlayer + ' fichas.');
    send('');
	
	if (isOnline) {
		send(`Puedes cambiar tu nombre con 'myname [nombre]'.`);
	} else {
    	send(`Puedes establecer un nombre personalizado para cada jugador con 'setname [número del jugador] [nombre]'.`);
	}
	
	send('');
    
    if (isOnline) {
        send(`También puedes chatear durante el juego en línea con 'chat [mensaje]'.`);
        send('');
    }
    
    nextTurn();
}

function endMatch() {
    hasStarted = false;
    isOnline = false;
    
    isBotMode = false;
    
    isAutoMode = false;
    clearInterval(autoModeId);
    
    send();
    printPlayers();
    
    var winnerId = 1;
    
    players.forEach(thisPlayer => {
        if (thisPlayer.chips >= players.get(winnerId).chips) {
            winnerId = thisPlayer.id;
        }
    });
    
    var playerWinner = players.get(winnerId);
    
    sendMore('Y el ganador es...<br>'
            + getCurPlayerStr() + ', con ' + getChipWord(playerWinner.chips) + '. ¡Enhorabuena!<br>'
            + '<br>'
            + '- FIN DE LA PARTIDA -<br>');
    send('');
    send(`Puedes crear una nueva partida con 'newgame [número de jugadores (1-5)]'.`);
    
    
    interactor.innerHTML = 'Y el ganador es...<br>'
    + getCurPlayerStr() + ', con ' + getChipWord(playerWinner.chips) + '. ¡Enhorabuena!<br>'
    + '<br>'
    + '- FIN DE LA PARTIDA -<br><br>'
    + '<button id="buttonGoBack">Salir</button>';
    
    buttonGoBack.addEventListener('click', () => {
        fillTable();
    });
}

function nextTurn() {
    if (playersCount == currentPlayer) {
        currentPlayer = 1;
    } else {
        currentPlayer += 1;
    }
    
    dice1Value = 0;
    dice2Value = 0;
    dicesValue = 0;
    
    send('- Turno de ' + getCurPlayerStr() + ' -');
    
    if ((isOnline && currentPlayer == onlinePlayer)
		|| (isBotMode && currentPlayer == 1)
		|| (!isOnline && !isBotMode && !isAutoMode)
	) {
        send(`Arroja un solo dado con 'throwdice'. Arroja ambos con 'throwdices'.`);
    }
}

var alertBuffer = '';

function tryAlert(text) {
    if (isTableMode && !usedTerm) {
        alertBuffer += text + '\n';
    }
}

function sendMore(text, result) {
    send(text, result);
    
    if (isTableMode && !usedTerm) {
        alertBuffer += text.replace('<br>', '\n') + '\n';
    }
}

function send(text, result) {
    if (text != null) {
        scroller.innerHTML += text;
    }
    
    scroller.innerHTML += '<br>';
    
    if (result != null) {
        scroller.innerHTML += result;
        
        if (result != '') {
            scroller.innerHTML += '<br>';
        }
    }
}

function sendStart() {
    var playerName = hasStarted ? players.get(currentPlayer).name : 'player';
    
    scroller.innerHTML += '<span class="start">' + playerName + '@pucherin:</span><span class="startSeparator">~</span> $ ';
}

function generateDice() {
    return Math.floor(Math.random() * 6) + 1;
}

function processTurn() {
    dicesValue = dice1Value + dice2Value;
    
    sendMore('La suma de ambos dados (' + dice1Value + ' y ' + dice2Value + ') es ' + dicesValue + '.');
    send('');
    
    if (isLuckMode) {
        isLuckMode = false;
        
        if (dicesValue != 12) {
            sendMore('Vaya, no es un 12. La partida continúa.');
            
            printStatus();
            nextTurn();
        } else {
            sendMore('¡12! ¡12! ¡Un 12! ' + getCurPlayerStr() + ' se lleva TODAS las fichas del tablero.');
            
            players.get(currentPlayer).chips += getTotalChips();
            
            endMatch();
        }
        
        return;
    }
    
    var curTile = tiles.get(dicesValue);
    var curPlayer = players.get(currentPlayer);
    
    if (dicesValue == 7) {
        if (curPlayer.chips == 0) {
            sendMore('A' + getCurPlayerStr() + ' no le quedan fichas que añadir al puchero.');
            
            //tryLuck();
            //return;
        } else {
            curPlayer.chips -= 1;
            curTile.chips += 1;
            
            sendMore(getCurPlayerStr() + ' añade una ficha al puchero. El puchero queda con ' + getChipWord(curTile.chips)
                    + '.<br>Ahora tiene ' + getChipWord(curPlayer.chips) + '.');
            
            if (curTile.chips == 4) {
                curPlayer.points += curTile.chips;
                curTile.chips = 0;
                
                sendMore('¡DING! El puchero queda completo con 4 fichas; te las llevas.<br>'
                        + 'Ahora tienes ' + getChipWord(curPlayer.chips) + ' y ' + getPointWord(curPlayer.points) + '.');
            }
        }
    } else if (dicesValue == 12) {
		if (curPlayer.chips == 0) {
			sendMore('¡12! ¡12! ¡Un 12! ya que a ' + getCurPlayerStr()
					+ ' no le quedan fichas, se lleva TODAS las fichas del tablero.');
            
            players.get(currentPlayer).chips += getTotalChips();
            
            endMatch();
		} else {
			curPlayer.points += tiles.get(7).chips;
			tiles.get(7).chips = 0;
			
			sendMore('¡DING! Con un 12 en los dados, te llevas el contenido del puchero (' + getChipWord(tiles.get(7).chips)
					+ ').<br>Ahora tienes ' + getChipWord(curPlayer.chips) + ' y ' + getPointWord(curPlayer.points) + '.');
		}
    } else {
        if (curPlayer.chips == 0) {
            curPlayer.points += curTile.chips;
            
            sendMore('Ya que no te quedan fichas para añadir a la casilla, te llevas todas las fichas en ésta (' + curTile.chips
                    + '). Ahora tienes ' + getChipWord(curPlayer.chips) + ' y ' + getPointWord(curPlayer.points) + '.');
            
            curTile.chips = 0;
            
            //tryLuck();
            //return;
        } else {
            curPlayer.chips -= 1;
            curTile.chips += 1;
            
            sendMore(getCurPlayerStr() + ' deposita una ficha en la casilla ' + curTile.id + ', quedándose en ' + getChipWord(curPlayer.chips)
                    +'.<br>Esta casilla ahora tiene ' + getChipWord(curTile.chips) + '.');
            
            if (curTile.id == curTile.chips) {
                curPlayer.points += curTile.chips;
                curTile.chips = 0;
                
                sendMore('¡DING! El número de fichas en la casilla corresponde con el número de ésta ('
                        + curTile.id + '); ' + getCurPlayerStr() + ' se lleva todas las fichas que ésta contiene (' + curTile.id+ ').'
                        + '\nAhora tiene ' + getChipWord(curPlayer.chips) + ' y ' + getPointWord(curPlayer.points) + '.');
            }
        }
    }
    
    // False if match ended during this turn
    if (hasStarted) {
        printStatus();
        nextTurn();
    }
    
    if (isBotMode && currentPlayer != 1 && hasStarted) {
		if (alertBuffer != '') {
			alert(alertBuffer);
			
			alertBuffer = '';
		}
        
        dice1Value = generateDice();
        dice2Value = generateDice();
        
        if (currentPlayer != 1) {
            tryAlert('Turno de ' + getCurPlayerStr() + '.\n');
        }
        
        processTurn();
    }
}

// Deleted mode, back when you had a second opportunity to get a 12
function tryLuck() {
    send();
    send(`¡DING, DING, DIIING! Ya que a ` + getCurPlayerStr() + ` no le quedaban fichas, es hora de probar suerte.`);
    send(`Hora de arrojar los dados con 'throwdice' o 'throwdices'.`);
    send(`Si obtiene un 12, se acabó la partida.`);
    
    if (isTableMode) {
        tryAlert('¡DING, DING, DIIING! Ya que a ' + getCurPlayerStr() + ' no le quedaban fichas, es hora de probar suerte.\n'
                + 'Si obtienes un 12, se acabó la partida.');
    }
    
    isLuckMode = true;
    
    dice1Value = 0;
    dice2Value = 0;
    dicesValue = 0;
}

function processInput(inputValue) {
    send(inputValue);
    
    var params = inputValue.split(' ');
    var thisCommandName = params[0];
    
    // Removing first param, as it is the command name
    params.shift();
    
    var thisCommand = commands.get(thisCommandName);
    
    if (thisCommand == null) {
        send(`Comando '` + thisCommandName + `' inválido.`);
    } else {
        if (thisCommand.requiresMatch && hasStarted == false) {
            send(`El comando '` + thisCommand.name + `' requiere de una partida en curso. Créala con 'newgame [número de jugadores (1-5)]'.`);
        } else {
            if (params.length != thisCommand.params && thisCommand.params != null) {
                send(`El comando '` + thisCommand.name + `' requiere ` + thisCommand.params + ` ` +
                        (thisCommand.params == 1 ? `parámetro` : `parámetros.`));
            } else {
                thisCommand.process(params);
            }
        }
    }
    
    sendStart();
    fillTable();
    
    scroller.scrollTop = scroller.scrollHeight;
    
    if (alertBuffer != '') {
        alert(alertBuffer);
        
        alertBuffer = '';
    }
    
    justSent = false;
}

document.getElementById('writterForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const inputValue = document.getElementById('writterInput');

    if (inputValue.value == '') {
        return;
    }
    
    usedTerm = true;
    justSent = true;
    
    processInput(inputValue.value);
    
    usedTerm = false;

    inputValue.value = '';
}, false);

send('- PUCHERÍN ONLINE -');
send(`Para crear una nueva partida, utiliza 'newgame [número de jugadores (1 a 5)]'.`);
send(`Juega contra la máquina con 'botmode [número de bots (1 a 4)]'.`);
send(`Deja que la partida se juegue sola con 'automode [número de bots (1 a 5)]'.`);
send(`Accede al modo online 1vs1 con 'online [nombre]'.`);
send();
send(`Lista todos los comandos disponibles con 'commands'.`);
sendStart();

var interactor = document.getElementById('interactor');

var socket;

function doOnline() {
    isOnline = true;
    
    interactor.innerHTML = 'Conectando con el servidor...';
    send('Conectando con el servidor...');
    
    socket = new WebSocket(protocol + '://' + host + ':' + port);
    
    socket.onopen = function() {
        interactor.innerHTML = '<br>Handshake...';
        send('<br>Handshake...');
        
        socket.send('hello');
    }
    
    socket.onerror = function() {
		hasStarted = false;
		isOnline = false;
		
        interactor.innerHTML = 'Error de conexión.<br><br>';
        interactor.innerHTML += '<button id="buttonResetScreen">Regresar</button>';
		
        send('Error de conexión.');
        sendStart();
        
        buttonResetScreen.addEventListener('click', () => {
            fillTable();
        });
    }
    
    socket.onmessage = function(input) {
        inputCommand = input.data.split(' ');
        
        switch (inputCommand[0]) {
            case 'welcome':
                interactor.innerHTML = 'Conectado. Autenticando...';
                socket.send('tryauth')
                break;
            case 'auth':
                interactor.innerHTML = 'Conectado. Esperando jugador rival...';
                send('Conectado. Esperando jugador rival...');
                sendStart();
                
                break;
            case 'started':
                onlinePlayer = parseInt(inputCommand[1]);
                
                processInput('newgame 2')
				
				processInput('myname ' + futureOnlineName);
                break;
            case 'throwdice':
                lastThrow = parseInt(inputCommand[1]);
                
                processInput('throwdice')
                break;
            case 'throwdices':
                lastThrow1 = parseInt(inputCommand[1]);
                lastThrow2 = parseInt(inputCommand[2]);
                
                processInput('throwdices')
                break;
            case 'setname':
                players.get(parseInt(inputCommand[1])).name = inputCommand[2];
                
				send();
                send('El nombre del jugador ' + inputCommand[1] + ' ha sido cambiado a ' + inputCommand[2] + '.');
                sendStart();
				
                fillTable();
                break;
            case 'chat':
                var chatId = inputCommand[1];
                inputCommand.shift();
                inputCommand.shift();
                
                send(getPlayerStr(chatId) + ': ' + inputCommand.join(' '));
                sendStart();
                break;
            case 'otherleft':
                socket.close();
                
                interactor.innerHTML = 'Tu contrincante ha abandonado la partida.<br><br>';
                interactor.innerHTML += '<button id="buttonGoBack">Salir</button>';
                
				isOnline = false;
                hasStarted = false;
				
                buttonGoBack.addEventListener('click', () => {
                    fillTable();
                });
                
                break;
        }
    }
}

fillTable();

function fillTable() {
    drawEverything();
    
    interactor.innerHTML = '';
	
    if (!hasStarted) {
		interactor.innerHTML += '<b>- PUCHERÍN ONLINE -</b><br><br>';
        interactor.innerHTML += '<button id="buttonNewMatch">Nueva partida</button> Varios jugadores en un mismo dispositivo.<br>';
        interactor.innerHTML += '<button id="buttonBotMode">Jugar contra bots</button> Juega una partida individual contra bots.<br>';
        interactor.innerHTML += '<button id="buttonAutoMode">Modo automático</button> Deja que los bots completen una partida.<br>';
        interactor.innerHTML += '<button id="buttonOnline">Online 1vs1</button> ';
        interactor.innerHTML += 'Estado del servidor: <span id="interactorStatus"></span>';
        
		if (!isOnline) {
			var statusSocket = new WebSocket(protocol + '://' + host + ':' + port);
			
			statusSocket.onopen = function() {
				statusSocket.send('players');
			}
			
			statusSocket.onerror = function() {
				if (!isOnline) {
					interactorStatus.innerHTML += 'Apagado.';
				}
			}
			
			statusSocket.onmessage = function(input) {
				var inputCommand = input.data.split(' ');
				
				if (inputCommand[0] == 'players') {
					interactorStatus.innerHTML += 'En línea, con ' + inputCommand[1] + ' '
							+ (inputCommand[1] == 1 ? ' jugador' : 'jugadores') + '.';
					
					statusSocket.close();
				}
			}
			
			buttonNewMatch.addEventListener('click', () => {
				var newPlayersCount = window.prompt('Introduce el número de jugadores (1-5)');
				
				if (newPlayersCount != null) {
					processInput('newgame ' + newPlayersCount);
				}
			});
			
			buttonBotMode.addEventListener('click', () => {
				var newPlayersCount = window.prompt('Introduce el número de contrincantes (1-4)');
				
				if (newPlayersCount != null) {
					processInput('botmode ' + newPlayersCount);
				}
			});
			
			buttonAutoMode.addEventListener('click', () => {
				var newPlayersCount = window.prompt('Introduce el número de jugadores (1-5)');
				
				if (newPlayersCount != null) {
					processInput('automode ' + newPlayersCount);
				}
			});
			
			buttonOnline.addEventListener('click', () => {
				futureOnlineName = window.prompt('Introduce el nombre de tu jugador');
				
				if (futureOnlineName != null) {
					processInput('online ' + futureOnlineName);
				}
			});
		}
	} else {
		players.forEach(thisPlayer => {
			var canChangeName = !isOnline || (onlinePlayer == thisPlayer.id);
			
			interactor.innerHTML += ''
				+ '(' + thisPlayer.id + ') '
				+ (canChangeName ? '<u id="rename' + thisPlayer.id + '">' : '')
				+ thisPlayer.name
				+ (canChangeName ? '</u>' : '')
				+ ': ' + getChipWord(thisPlayer.chips)
				+ ', ' + getPointWord(thisPlayer.points) + '<br>';
        });
        
        interactor.innerHTML += '<br>Turno de ' + getCurPlayerStr() + '. ';
        
        interactor.innerHTML += '<br><br>';
        
        if (isOnline && currentPlayer != onlinePlayer) {
            interactor.innerHTML += 'Esperando a que el otro jugador lance los dados...';
            
            return;
        }
        
        if (dice1Value == 0) {
            interactor.innerHTML += '<button id="buttonThrowDice">Lanzar dado 1</button> ';
            interactor.innerHTML += '<button id="buttonThrowDices">Lanzar ambos dados</button> ';
        
            buttonThrowDice.addEventListener('click', () => {
                justSent = true;
                
                processInput('throwdice');
            });
            
            buttonThrowDices.addEventListener('click', () => {
                justSent = true;
                
                processInput('throwdices');
            });
        } else {
            interactor.innerHTML += '<button id="buttonThrowDice">Lanzar dado 2</button>';
        
            buttonThrowDice.addEventListener('click', () => {
                processInput('throwdice');
            });
        }
		
		if (isOnline) {
			document.getElementById('rename' + onlinePlayer).addEventListener('click', () => {
				var newName = window.prompt('Introduce tu nuevo nombre');
				
				if (newName != null) {
					processInput('myname ' + newName);
				}
			});
		} else {
			players.forEach(thisPlayer => {
				document.getElementById('rename' + thisPlayer.id).addEventListener('click', () => {
					var newName = window.prompt('Introduce un nuevo nombre para '
							+ getPlayerStr(thisPlayer.id));
					
					if (newName != null) {
						processInput('setname ' + thisPlayer.id + ' ' + newName);
					}
				});
			});
		}
    }
}

async function startAuto(autoPlayersCount) {
    isAutoMode = true;
    processInput('newgame ' + autoPlayersCount);
    
    autoModeId = setInterval(function() {
        usedTerm = true;
        processInput('throwdices');
    }, 100);
}
