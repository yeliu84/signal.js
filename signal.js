;(function(global) {
    var prevSignal = global.Signal;

    var Signal = global.Signal = {
        __version__: '0.0.1',
        __license__: 'BSD',
        __author__: 'Ye Liu',
        __contact__: 'yeliu@instast.com',
        __copyright__: 'Copyright (c) 2012 Ye Liu'
    };

    Signal.noConflict = function() {
        global.Signal = prevSignal;
        return this;
    };

    /* ----- User Configurable Properties ----- */

    Signal.allowDuplicateSlots = false;

    Signal.isSenderCompatible = function(expected, actual) {
        if (expected !== undefined && expected !== null) {
            return expected === actual;
        }
        return true;
    };

    /* ----- General Helper Functions ----- */

    var emptyFn = function() {}

    var toString = Object.prototype.toString;

    var isObject;

    if (toString.call(null) === '[object Object]') {
        isObject = function (o) {
            return (o !== null && o !== undefined &&
                toString.call(o) === '[object Object]');
        };
    }
    else {
        isObject = function(o) {
            return toString.call(o) === '[object Object]';
        };
    }

    var isFunction;

    if (document !== undefined &&
            typeof document.getElementsByTagName('body') === 'function') {
        isFunction = function(o) {
            return toString.call(o) === '[object Function]';
        };
    else {
        isFunction = function(o) {
            return typeof o === 'function';
        };
    }

    var argumentsToArray = function(a) {
        var args = [];

        a = a || [];

        for (var i = 0; i < a.length; i++) {
            args[i] = a[i];
        }

        return args;
    };


    /* ----- Helper Functions ----- */

    var objIdSeq = 1;

    var markObj = Signal.markObj = function(o) {
        if (isObject(o) && !o._signalObjId) {
            o._signalObjId = objIdSeq++;
        }

        return o;
    };

    var unmarkObj = Signal.unmarkObj = function(o) {
        if (isObject(o)) {
            delete o._signalObjId;
        }

        return o;
    };

    var compareObj = function(x, y) {
        if (isObject(x) && isObject(y)) {
            if (x._signalObjId && y._signalObjId) {
                return x._signalObjId === y._signalObjId;
            }
        }

        return x === y;
    };


    /* ----- Slot ----- */

    var slotIdSeq = 0;

    var Slot = Signal.Slot = function(fn, receiver, sender) {
        this.id = slotIdSeq++;
        this._fn = fn || emptyFn;
        this._receiver = receiver || null;
        this._sender = sender || null;
    };

    Slot.prototype.call = function() {
        return this._fn.apply(this._receiver, arguments);
    };

    Slot.prototype.isEqual = function(o) {
        return this.compare(o, compareObj, compareObj);
    };

    Slot.prototype.isCompatible = function(o) {
        return this.compare(o, compareObj, Signal.isSenderCompatible);
    };

    Slot.prototype.isSenderCompatible = function(sender) {
        var isSenderCompatible = Signal.isSenderCompatible;

        if (isFunction(isSenderCompatible)) {
            return isSenderCompatible(this._sender, sender);
        }

        return this._sender === sender;
    };

    Slot.prototype.compare = function(o, compareReceiver, compareSender) {
        if (!(o instanceof Slot)) {
            return false;
        }

        if (this === o || this.id === o.id) {
            return true;
        }

        if (this._fn !== o._fn) {
            return false;
        }

        if (isFunction(compareReceiver) &&
                !compareReceiver(this._receiver, o._receiver)) {
            return false;
        }

        if (isFunction(compareSender) &&
                !compareSender(this._sender, o._sender)) {
            return false;
        }

        return true;
    };


    /* ----- BaseSignal ----- */

    var BaseSignal = Signal.BaseSignal = function() {
        this.slots = [];
    };

    BaseSignal.prototype.connect = function(slotFn, receiver, sender) {
        var newSlot;

        markObj(receiver);
        markObj(sender);

        newSlot = new Slot(slotFn, receiver, sender);

        if (!Signal.allowDuplicateSlots) {
            for (var i = this.slots.length - 1; i >= 0; i--) {
                if (this.slots[i].isEqual(newSlot)) {
                    return this.slots[i];
                }
            }
        }

        this.slots.push(newSlot);

        return newSlot;
    };

    BaseSignal.prototype.emit = function(sender) {
        var slot;

        for (var i = 0; i < this.slots.length; i++) {
            slot = this.slots[i];
            if (slot.isSenderCompatible(sender)) {
                slot.call.apply(slot, arguments);
            }
        }
    };

    BaseSignal.prototype.asyncEmit = function(sender) {
        var self = this;
        var args = arguments;

        setTimeout(function() {
            self.emit.apply(self, args);
        }, 1);
    };

    BaseSignal.prototype.disconnect = function(slotFn, receiver, sender) {
        return this.disconnectBySlot(new Slot(slotFn, receiver, sender));
    };

    BaseSignal.prototype.disconnectBySlot = function(slot) {
        var i = 0;
        var ret = null;

        while (i < this.slots.length) {
            if (this.slots[i].isEqual(slot)) {
                ret = this.slots.splice(i, 1);
            }
            else {
                i++;
            }
        }

        return ret ? ret[0] : null;
    };


    /* ----- Convenient Functions ----- */

    var signals = {};

    var create = Signal.create = function(name) {
        var signal = null;

        if (name === undefined || name === null) {
            return signal;
        }

        if (name in signals) {
            signal = signals[name];
        }
        else {
            signal = signals[name] = new BaseSignal();
        }

        return signal;
    };

    var connect = Signal.connect = function(name, slotFn, receiver, sender) {
        var signal = create(name);

        if (signal) {
            return signal.connect(slotFn, receiver, sender);
        }

        return null;
    };

    var disconnect = Signal.disconnect = function(name,
            slotFn, receiver, sender) {
        var signal = create(name);

        if (signal) {
            return signal.disconnect(slotFn, receiver, sender);
        }

        return null;
    };

    var disconnectBySlot = Signal.disconnectBySlot = function(name, slot) {
        var signal = create(name);

        if (signal) {
            return signal.disconnectBySlot(slot);
        }

        return null;
    };

    var emit = Signal.emit = function(name) {
        var signal = create(name);
        var args;

        if (!signal) {
            return;
        }
        
        args = argumentsToArray(arguments);
        args.shift();

        signal.emit.apply(signal, args);
    };

    var asyncEmit = Signal.asyncEmit = function(name) {
        var signal = create(name);
        var args;

        if (!signal) {
            return;
        }
        
        args = argumentsToArray(arguments);
        args.shift();

        signal.asyncEmit.apply(signal, args);
    };
})(this);
