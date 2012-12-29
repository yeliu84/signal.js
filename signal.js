var Signal = {
    __version__: '0.0.1',
    __ver__: [0, 0, 1],
    __author__: 'Ye Liu',
    __contact__: 'yeliu@instast.com',
    __license__: 'BSD',
    __copyright__: 'Copyright (c) 2012 Ye Liu'
};

(function() {
    /* ----- User Configurable Properties ----- */

    Signal.allowDuplicateSlots = false;

    Signal.isSenderCompatible = function(expected, actual) {
        if (expected !== undefined && expected !== null) {
            return expected === actual;
        }
        return true;
    };


    /* ----- General Helper Functions ----- */

    function emptyFn() {}

    var toString = Object.prototype.toString;

    /*
     * The following `isX` functions are copied from ExtJS 4.1, see
     * http://docs.sencha.com/ext-js/4-1/source/Ext.html for details.
     */
    var isObject = (toString.call(null) === '[object Object]') ?
    function isObject(o) {
        return o !== null && o !== undefined && toString.call(o) === '[object Object]';
    } :
    function isObject(o) {
        return toString.call(o) === '[object Object]';
    };

    var isFunction = (document !== undefined && typeof document.getElementsByTagName('body') === 'function') ?
    function isFunction(o) {
        return toString.call(o) === '[object Function]';
    } :
    function isFunction(o) {
        return typeof o === 'function';
    };

    var isArray = ('isArray' in Array) ? Array.isArray : function isArray(o) {
        return toString.call(o) === '[object Array]';
    };

    function isNumber(o) {
        return typeof o === 'number' && isFinite(o);
    }

    function argumentsToArray(a) {
        var args = [];

        a = a || [];

        for (var i = 0; i < a.length; i++) {
            args[i] = a[i];
        }

        return args;
    }


    /* ----- Helper Functions ----- */

    var objIdSeq = 1;

    function markObj(o) {
        if (isObject(o) && !o._signalObjId) {
            o._signalObjId = objIdSeq++;
        }
        return o;
    }

    function unmarkObj(o) {
        if (isObject(o)) {
            delete o._signalObjId;
        }
        return o;
    }

    function compareObj(x, y) {
        if (isObject(x) && isObject(y)) {
            if (x._signalObjId && y._signalObjId) {
                return x._signalObjId === y._signalObjId;
            }
        }
        return x === y;
    }


    /* ----- Slot ----- */

    var slotIdSeq = 0;

    function Slot(fn, receiver, sender) {
        this.id = slotIdSeq++;
        this._fn = fn || emptyFn;
        this._receiver = receiver || null;
        this._sender = sender || null;
    }

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

        if (isFunction(compareReceiver) && !compareReceiver(this._receiver, o._receiver)) {
            return false;
        }

        if (isFunction(compareSender) && !compareSender(this._sender, o._sender)) {
            return false;
        }

        return true;
    };


    /* ----- BaseSignal ----- */

    function BaseSignal() {
        this.slots = [];
    }

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

    function create(name) {
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
    }

    function connect(name, slotFn, receiver, sender) {
        var signal = create(name);

        if (signal) {
            return signal.connect(slotFn, receiver, sender);
        }

        return null;
    }

    function disconnect(name, slotFn, receiver, sender) {
        var signal = create(name);

        if (signal) {
            return signal.disconnect(slotFn, receiver, sender);
        }

        return null;
    }

    function disconnectBySlot(name, slot) {
        var signal = create(name);

        if (signal) {
            return signal.disconnectBySlot(slot);
        }

        return null;
    }

    function emit(name) {
        var signal = create(name);
        var args;

        if (!signal) {
            return;
        }
        
        args = argumentsToArray(arguments);
        args.shift();

        signal.emit.apply(signal, args);
    }

    function asyncEmit(name) {
        var signal = create(name);
        var args;

        if (!signal) {
            return;
        }
        
        args = argumentsToArray(arguments);
        args.shift();

        signal.asyncEmit.apply(signal, args);
    }

    Signal.Slot = Slot;
    Signal.BaseSignal = BaseSignal;
    Signal.create = create;
    Signal.connect = connect;
    Signal.disconnect = disconnect;
    Signal.disconnectBySlot = disconnectBySlot;
    Signal.emit = emit;
    Signal.asyncEmit = asyncEmit;
    Signal.markObj = markObj;
    Signal.unmarkObj = unmarkObj;
})();
