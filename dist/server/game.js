"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const player_1 = __importDefault(require("./player"));
class Game {
    constructor(io) {
        this.recentWinners = [
            { screenName: 'fcs', score: 293.8 },
            { screenName: 'sbcode', score: 232.5 },
            { screenName: 'SeanWasEre', score: 157.7 },
            { screenName: 'cosmo', score: 251.3 },
            { screenName: 'emmy', score: 267.1 },
            { screenName: 'ball-vr', score: 275.2 },
            { screenName: 'ballgame', score: 286.4 },
        ];
        this.winnersCalculated = false;
        this.players = {};
        this.playerCount = 0;
        this.recalcWinnersTable = () => {
            let lowestScore = 0;
            let lowestScoreScreenName = '';
            //add all players with score > 0
            Object.keys(this.players).forEach((p) => {
                if (this.players[p].r > 60) {
                    this.recentWinners.push({
                        screenName: this.players[p].sn,
                        score: this.players[p].r, // race time
                    });
                }
                if (this.players[p].r < lowestScore) {
                    lowestScore = this.players[p].r;
                    lowestScoreScreenName = this.players[p].sn;
                }
            });
            //sort
            this.recentWinners.sort((a, b) => (a.score > b.score ? 1 : b.score > a.score ? -1 : 0));
            //keep top scores
            while (this.recentWinners.length > 7) {
                this.recentWinners.pop();
            }
            // if (lowestScoreScreenName != '') {
            //     this.io.emit('winner', lowestScoreScreenName, this.recentWinners)
            // }
            this.winnersCalculated = true;
        };
        this.io = io;
        this.io.on('connection', (socket) => {
            this.players[socket.id] = new player_1.default();
            this.players[socket.id].sn = 'Guest' + this.playerCount++;
            console.log('a user connected : ' + socket.id);
            this.recalcWinnersTable();
            socket.emit('joined', socket.id, this.players[socket.id].sn, this.recentWinners);
            socket.on('disconnect', () => {
                console.log('socket disconnected : ' + socket.id);
                if (this.players && this.players[socket.id]) {
                    console.log('deleting ' + socket.id);
                    delete this.players[socket.id];
                    io.emit('removePlayer', socket.id);
                }
            });
            socket.on('update', (message) => {
                if (this.players[socket.id]) {
                    this.players[socket.id].e = message.e;
                    this.players[socket.id].t = message.t;
                    this.players[socket.id].p = message.p;
                    this.players[socket.id].q = message.q;
                    this.players[socket.id].v = message.v;
                    this.players[socket.id].w[0].p = message.w[0].p;
                    //this.players[socket.id].w[0].q = message.w[0].q
                    this.players[socket.id].w[1].p = message.w[1].p;
                    //this.players[socket.id].w[1].q = message.w[1].q
                    this.players[socket.id].w[2].p = message.w[2].p;
                    //this.players[socket.id].w[2].q = message.w[2].q
                    this.players[socket.id].w[3].p = message.w[3].p;
                    //this.players[socket.id].w[3].q = message.w[3].q
                    if (this.players[socket.id].e && this.players[socket.id].s > 0) {
                        if (!this.players[socket.id].f) {
                            const totalTime = Math.round(((Date.now() - this.players[socket.id].s) / 1000) * 10) / 10;
                            this.players[socket.id].r = totalTime; // race time
                            if (this.players[socket.id].p.z < -750) {
                                this.players[socket.id].f = true; // at finish line
                                this.recalcWinnersTable();
                                socket.emit('winner', totalTime);
                                this.io.emit('winnersTable', this.recentWinners);
                            }
                        }
                    }
                    else {
                        this.players[socket.id].r = 0;
                    }
                }
            });
            socket.on('spawn', () => {
                console.log(Date.now() + ' spawned');
                this.players[socket.id].r = 0;
                this.players[socket.id].s = 0;
                this.players[socket.id].f = false;
            });
            socket.on('startTimer', () => {
                this.players[socket.id].s = Date.now();
            });
            socket.on('updateScreenName', (screenName) => {
                console.log(screenName);
                if (screenName.match(/^[0-9a-zA-Z]+$/) && screenName.length <= 12) {
                    this.players[socket.id].sn = screenName;
                }
            });
            socket.on('enable', () => {
                this.players[socket.id].e = true;
            });
        });
        setInterval(() => {
            this.io.emit('gameData', {
                players: this.players,
            });
        }, 50);
        // setInterval(() => {
        //     //do somethin here if it only needs slower updates
        // }, 1000)
    }
}
exports.default = Game;