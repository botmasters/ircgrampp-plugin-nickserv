
import PluginBase from 'ircgrampp-plugin';
import Indentifier from './identifier';

export default class NickServPlugin extends PluginBase {
    
    initialize() {
        this.debug('NickServ plugin started');
        this._connectionOptions = this.config.get('connections');
        this._autoconnect = false;
        this._connections = [];
    }

    getCompatibleVersion() {
        return "~0.4.2";
    }

    afterIrcconnectionCreate(connection) {
        this.debug('New connection, check if there are options for this');

        let options = connection._options;

        let connectionOptions = this._connectionOptions.find((x) => {
            return x.server === options.server && x.nick === options.nick;
        });

        if (connectionOptions) {
            this.debug(`Options find to ${options.nick}@${options.server}`);
            this._connections.push(new Indentifier(
                this,
                connection,
                connectionOptions
            ));
        } else {
            this.debug('Not found, ignoring');
        }

        return options;
    }

    beforeIrcconnectionWaitForRegistered(connection) {
        const con = this._connections
            .find((x) => x.identifier === connection.__identifier)

        if (con) {
            this.debug(`Waiting for registered of ${con.identifier}`);
            return connection.__identifier.waitForSuccess();
        }

        this.debug(
            `Waiting for registered of ${connection.__identifier} ignored`
        );
    }
}
