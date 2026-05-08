"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceContainer = void 0;
class ServiceContainer {
    registrations = new Map();
    registerSingleton(token, factory) {
        this.registrations.set(token, {
            factory: factory,
            singleton: true,
            instance: undefined,
        });
    }
    registerTransient(token, factory) {
        this.registrations.set(token, {
            factory: factory,
            singleton: false,
            instance: undefined,
        });
    }
    resolve(token) {
        const registration = this.registrations.get(token);
        if (!registration) {
            throw new Error("No registration found for requested dependency token.");
        }
        if (!registration.singleton) {
            return registration.factory(this);
        }
        if (registration.instance === undefined) {
            registration.instance = registration.factory(this);
        }
        return registration.instance;
    }
}
exports.ServiceContainer = ServiceContainer;
