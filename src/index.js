
import {EventEmitter} from 'events';
import NickServ from 'nickserv';
import PluginBase from 'ircgrampp-plugin';

class Indentifier extends EventEmitter {

    constructor(plugInstance, connection, connectionOptions) {
        super();
        this._plugin = plugInstance;
        this._connection = connection;
        this._identified = false;
        this._nick = connection.nick;
        this._config = (connectionOptions);
        this._ts = null;

        this._ns = new NickServ(this._nick, {
        
        });

        this.debug(`Attaching identifier to ${this._connection.identifier}`);
        debugger;
        this._ns.attach('irc', this._connection.client);

        this._ns.on('loggedout', () => {
            this.debug(`Logged out, re-identify`);
            this._identified = false;
            this.identify();
        });

        this._ns.on('notice', (notice) => {
            this.debug('Received notice ' + notice);
        });

        this.identify();
    }

    identify() {
        if (this._identified) {
            return;
        }

        this.debug('Identifing');

        this._ts = setTimeout(() => {
            this.debug('Login timeout');
            throw new Error('Login timeout');
        }, 30000);

        this._ns.once('identified', () => {
            clearTimeout(this._ts);
            this.debug('Identify success');
            this._identified = true;
            this.emit('success');
        });

        this._ns.identify(this._config.password, (err) => {
            if (err) {
                this.debug('Error', err);
                throw err;
            }
        });
    }

    waitForSuccess() {
        if (this._identified) {
            return this.Promise.resolve(false);
        }

        return new this.Promise((resolve) => {
            this.debug('Waiting for success');
            this.once('success', () => {
                resolve(true);
            });
        });
    }

    get debug() {
        return this._plugin.debug;
    }

    get Promise() {
        return this._plugin.Promise;
    }

    get isIdentified() {
        return this._identified;
    }

}

export default class NickServPlugin extends PluginBase {
    
    initialize() {
        this.debug('NickServ plugin started');
        this._connectionOptions = this.config.get('connections');
        this._autoconnect = false;
    }

    getCompatibleVersion() {
        return "~0.3.0";
    }

    afterIrcconnectionCreate(connection) {
        this.debug('New connection, check if there are options for this');

        let options = connection._options;

        let connectionOptions = this._connectionOptions.find((x) => {
            return x.server === options.server && x.nick === options.nick;
        });

        if (connectionOptions) {
            this.debug(`Options find to ${options.nick}@${options.server}`);
            connection.__identifier = new Indentifier(
                this,
                connection,
                connectionOptions);
        } else {
            this.debug('Not found, ignoring');
        }

        return options;
    }

    beforeIrcconnectionWaitForRegistered(connection) {
        if (connection.__identifier) { 
            return connection.__identifier.waitForSuccess();
        }
    }
}
