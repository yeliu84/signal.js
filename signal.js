;(function() {
    Signal = {
        __version__: '0.0.1',
        __ver__: [0, 0, 1],
        __author__: 'Ye Liu',
        __contact__: 'yeliu@instast.com',
        __license__: 'BSD',
        __copyright__: 'Copyright (c) 2012 Ye Liu'
    };

    /* ----- Functions for Object Types ----- */

    var toString = Object.prototype.toString;

    var isObject = function(o) {
        if (toString.call(null) === '[object Object]') {
            return o !== null && o !== undefined && toString.call(o) === '[object Object]';
        }
        return toString.call(o) === '[object Object]';
    };

    var isString = function(o) {
        return typeof o === 'string';
    };

    var getType = function(o) {
    };

    var objIdSeq = 1;

    var mark = function(o) {
        if (!o._signalObjId) {
            o._signalObjId = objIdSeq++;
        }
        return o;
    };

    var unmark = function(o) {
        delete o._signalObjId;
        return o;
    };

    var compareObj = function(x, y) {
        if (x._signalObjId && y._signalObjId) {
            return x._signalObjId === y._signalObjId;
        }
        return x === y;
    };

    var slotIdSeq = 0;

    Signal.Slot = function(fn, receiver, sender) {
        this.id = slotIdSeq++;
        this._fn = fn || function() {};
        this._receiver = receiver || null;
        this._sender = sender || null;
    };

    Signal.Slot.prototype.call = function() {
        return this._fn.apply(this._receiver, arguments);
    };

    Signal.Slot.prototype.isEqual = function(o) {
        return this.equals(o, compareObj, compareObj);
    };

    Signal.Slot.prototype.isCompatible = function(o) {
        var self = this;
        return self.equals(o, compareObj, function(mySender, otherSender) {
            return self.isSenderCompatible(otherSender);
        });
    };

    Signal.Slot.prototype.isSenderCompatible = function(otherSender) {
        if (!this._sender) {
            return true;
        }

        if (!otherSender) {
            return false;
        }

        if (!compareObj(this._sender, otherSender)) {
            if (isString(this._sender) && isObject(otherSender)) {
                return mySender === Ext.getClassName(otherSender);
            }

            if (Ext.isString(otherSender) && Ext.isObject(mySender)) {
                return otherSender === Ext.getClassName(mySender);
            }

            return false;
        }

        return true;
    };

   Signal.Slot.prototype.equals = function(o, compareReceiverFn, compareSenderFn) {
        if (!Ext.isObject(o)) {
            return false;
        }

        if (this === o) {
            return true;
        }

        if (Ext.getClassName(this) === Ext.getClassName(o)) {
            if (this.id === o.id) {
                return true;
            }
            if (this.getFn() !== o.getFn()) {
                return false;
            }
            if (Ext.isFunction(compareReceiverFn) && !compareReceiverFn(this.getReceiver(), o.getReceiver())) {
                return false;
            }
            if (Ext.isFunction(compareSenderFn) && !compareSenderFn(this.getSender(), o.getSender())) {
                return false;
            }
            return true;
        }

        return false;
    }

    Ext.define('InfoFlo.signal.BaseSignal', {
        slots: undefined,

        statics: {
        },

        constructor: function() {
            this.slots = [];
        },

        connect: function(slotFn, receiver, sender) {
            var newSlot;

            InfoFlo.signal.BaseSignal.mark(receiver);
            InfoFlo.signal.BaseSignal.mark(sender);
            
            newSlot = Ext.create('InfoFlo.signal.Slot', {
                fn: slotFn,
                receiver: receiver,
                sender: sender
            });

            for (var i = 0; i < this.slots.length; i++) {
                if (this.slots[i].isEqual(newSlot)) {
                    return this.slots[i];
                }
            }

            this.slots.push(newSlot);

            return newSlot;
        },

        emit: function(sender) {
            var slot;

            for (var i = 0; i < this.slots.length; i++) {
                slot = this.slots[i];
                if (slot.isSenderCompatible(sender)) {
                    slot.call.apply(slot, arguments);
                }
            }
        },

        emitAsync: function(sender) {
            var me = this;
            var args = arguments;

            setTimeout(function() {
                me.emit.apply(me, args);
            }, 1);
        },

        disconnect: function(slotFn, receiver, sender) {
            return this.disconnectBySlot(Ext.create('InfoFlo.signal.Slot', {
                fn: slotFn,
                receiver: receiver,
                sender: sender
            }));
        },

        disconnectBySlot: function(slot) {
            var i = 0;
            var ret = null;

            while (i < this.slots.length) {
                if (this.slots[i] === slot || this.slots[i].isEqual(slot)) {
                    ret = this.slots.splice(i, 1);
                }
                else {
                    i++;
                }
            }

            return ret ? ret[0] : null;
        }
    });
})();
