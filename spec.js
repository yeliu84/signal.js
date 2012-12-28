function ReceiverClass() {}
function SenderClass() {}
function AnotherSenderClass() {}
function emptyFn() {}

describe('Signal', function() {
    it('is defined', function() {
        expect(Signal).toBeDefined();
    });
});

describe('Signal.Slot', function() {
    var Slot = Signal.Slot;
    var slotFn;
    var receiver;
    var sender;

    beforeEach(function() {
        slotFn = function() {
            return 111 + 125;
        };

        receiver = new ReceiverClass();
        sender = new SenderClass();

        Signal.markObj(receiver);
        Signal.markObj(sender);
    });

    it('is defined', function() {
        expect(Signal.Slot).toBeDefined();
    });

    it('calls provided function with correct arguments when invoking call()', function() {
        var fn = jasmine.createSpy('slot function')
        var slot = new Slot(fn);

        slot.call();
        expect(fn).toHaveBeenCalled();

        slot.call(1);
        expect(fn).toHaveBeenCalledWith(1);

        slot.call([1, '25']);
        expect(fn).toHaveBeenCalledWith([1, '25']);
    });

    it('calls provided function with correct context when invoking call()', function() {
        var fn = jasmine.createSpy('slot function')
        var receiver = new ReceiverClass();
        var slot = new Slot(fn, receiver);

        slot.call();
        expect(fn.mostRecentCall.object).toEqual(receiver);
    });

    it('is not equal to non-objects', function() {
        var slot = new Slot();

        expect(slot.isEqual(null)).toBe(false);
        expect(slot.isEqual(undefined)).toBe(false);
        expect(slot.isEqual(1)).toBe(false);
        expect(slot.isEqual(false)).toBe(false);
        expect(slot.isEqual('abc')).toBe(false);
        expect(slot.isEqual([1, 2, 3])).toBe(false);
    });

    it('is equal to itself', function() {
        var slot = new Slot();

        expect(slot.isEqual(slot)).toBe(true);
    });

    it('is not equal to objects from other classes', function() {
        var slot = new Slot();

        expect(slot.isEqual({})).toBe(false);
    });

    it('is an empty slot, so it is equal to an empty slot', function() {
        var slot = new Slot();
        var anotherSlot = new Slot();
        expect(slot.isEqual(anotherSlot)).toBe(true);
    });

    it('is equal to a slot which has the same configuration', function() {
        var slot = new Slot(slotFn, receiver, sender);
        var anotherSlot = new Slot(slotFn, receiver, sender);

        expect(slot.isEqual(anotherSlot)).toBe(true);
    });

    it('is equal to a slot with the same id even if the other slot has different configuration', function() {
        var slot = new Slot(slotFn, receiver, sender);
        var anotherSlot = new Slot(slotFn, Signal.markObj({}), sender);

        slot.id = anotherSlot.id;

        expect(slot.isEqual(anotherSlot)).toBe(true);
    });

    it('is not equal to a slot with different configuration', function() {
        var slot = new Slot(slotFn, receiver, sender);
        var anotherSlot = new Slot(slotFn, Signal.markObj({}), sender);

        expect(slot.isEqual(anotherSlot)).toBe(false);
    });

    it('is not equal to a slot with different function', function() {
        var slot = new Slot(slotFn);
        var anotherSlot = new Slot(function() {});

        expect(slot.isEqual(anotherSlot)).toBe(false);
    });

    it('is not equal to a slot with different receiver', function() {
        var slot = new Slot(slotFn, receiver);
        var anotherSlot = new Slot(slotFn, Signal.markObj({}));

        expect(slot.isEqual(anotherSlot)).toBe(false);
    });

    it('is not equal to a slot with different sender', function() {
        var slot = new Slot(slotFn, receiver, sender);
        var anotherSlot = new Slot(slotFn, receiver, Signal.markObj({}));

        expect(slot.isEqual(anotherSlot)).toBe(false);
    });

    it('calls the receiver comparison function when invoking compare()', function() {
        var slot = new Slot(slotFn, receiver, sender);
        var anotherReceiver = new ReceiverClass();
        var anotherSlot = new Slot(slotFn, anotherReceiver, sender);
        var compareFn = jasmine.createSpy('receiver comparison function');
        
        slot.compare(anotherSlot, compareFn, undefined);
        expect(compareFn).toHaveBeenCalledWith(receiver, anotherReceiver);
    });

    it('calls the sender comparison function when invoking compare()', function() {
        var slot = new Slot(slotFn, receiver, sender);
        var anotherSender = new SenderClass();
        var anotherSlot = new Slot(slotFn, receiver, anotherSender);
        var compareFn = jasmine.createSpy('sender comparison function');
        
        slot.compare(anotherSlot, undefined, compareFn);
        expect(compareFn).toHaveBeenCalledWith(sender, anotherSender);
    });

    it('returns false if the receiver comparison function returns false when invoking compare()', function() {
        var slot = new Slot();
        var anotherSlot = new Slot();
        var compareReceiverFn = function() {
            return false;
        };
        var compareSenderFn = function() {
            return true;
        };

        expect(slot.compare(anotherSlot, compareReceiverFn, compareSenderFn)).toBe(false);
    });

    it('returns false if the sender comparison function returns false when invoking compare()', function() {
        var slot = new Slot();
        var anotherSlot = new Slot();
        var compareReceiverFn = function() {
            return true;
        };
        var compareSenderFn = function() {
            return false;
        };

        expect(slot.compare(anotherSlot, compareReceiverFn, compareSenderFn)).toBe(false);
    });

    it('is compatible with itself', function() {
        var slot = new Slot();

        expect(slot.isCompatible(slot)).toBe(true);
    });

    it('is an empty slot, it is compatible with an empty slot', function() {
        var slot = new Slot();
        var anotherSlot = new Slot();

        expect(slot.isCompatible(anotherSlot)).toBe(true);
    });

    it('is compatible with a slot which has the same configuration', function() {
        var slot = new Slot(slotFn, receiver, sender);
        var anotherSlot = new Slot(slotFn, receiver, sender);

        expect(slot.isCompatible(anotherSlot)).toBe(true);
    });

    it('is not compatible with a slot which has a different fn', function() {
        var slot = new Slot(slotFn);
        var anotherSlot = new Slot(function() {});

        expect(slot.isCompatible(anotherSlot)).toBe(false);
    });

    it('is not compatible with a slot which has a different receiver', function() {
        var slot = new Slot(slotFn, receiver);
        var anotherSlot = new Slot(slotFn, Signal.markObj({}));

        expect(slot.isCompatible(anotherSlot)).toBe(false);
    });

    it('is not compatible with a slot which has no sender', function() {
        var slot = new Slot(slotFn, receiver, sender);
        var anotherSlot = new Slot(slotFn, receiver);

        expect(slot.isCompatible(anotherSlot)).toBe(false);
    });

    it('is not compatible with a slot which has a different sender', function() {
        var slot = new Slot(slotFn, receiver, sender);
        var anotherSlot = new Slot(slotFn, receiver, Signal.markObj({}));

        expect(slot.isCompatible(anotherSlot)).toBe(false);
    });

});

describe('Signal.BaseSignal', function() {
    var BaseSignal = Signal.BaseSignal;
    var signal;

    beforeEach(function() {
        signal = new BaseSignal();
    });

    it('returns a slot object when invoking connect()', function() {
        var slot = signal.connect(emptyFn, {}, {});
        expect(slot instanceof Signal.Slot).toBe(true);
    });

    it('returns the same slot object when invoking connect() multiple times with the same arguments', function() {
        var fn = function() {};
        var receiver = new ReceiverClass();
        var sender = new SenderClass();
        var slot1 = signal.connect(fn, receiver, sender);
        var slot2 = signal.connect(fn, receiver, sender);

        expect(slot1).toBe(slot2);
    });

    it('returns different slot objects when invoking connect() multiple times with different arguments', function() {
        var receiver = new ReceiverClass();
        var sender = new SenderClass();
        var slot1 = signal.connect(function() {}, receiver, sender);
        var slot2 = signal.connect(function() {}, receiver, sender);

        expect(slot1).not.toBe(slot2);
    });

    it('returns the corresponding slot object when invoking disconnect() with the same arguments as connect()', function() {
        var fn = function() {};
        var receiver = new ReceiverClass();
        var sender = new SenderClass();
        var slot1 = signal.connect(fn, receiver, sender);
        var slot2 = signal.disconnect(fn, receiver, sender);

        expect(slot2).toBe(slot1);
    });

    it('returns null if there is no corresponding slot when invoking disconnect()', function() {
        var receiver = new ReceiverClass();
        var sender = new SenderClass();
        var slot;
        
        signal.connect(function() {}, receiver, sender);
        slot = signal.disconnect(function() {}, receiver, sender);

        expect(slot).toBeNull();
    });

    it('returns the corresponding slot when invoking disconnectBySlot()', function() {
        var fn = function() {};
        var receiver = new ReceiverClass();
        var sender = new SenderClass();
        var slot1 = signal.connect(fn, receiver, sender);
        var slot2 = signal.disconnectBySlot(slot1);

        expect(slot2).toBe(slot1);
    });

    it('returns null if there is no such slot in the signal when invoking disconnectBySlot()', function() {
        var fn = function() {};
        var receiver = new ReceiverClass();
        var sender = new SenderClass();
        var slot;

        signal.connect(fn, receiver, sender);
        slot = signal.disconnectBySlot(new Signal.Slot());

        expect(slot).toBeNull();
    });

    it('calls the callback function with correct context when invoking emit()', function() {
        var fn = jasmine.createSpy('signal callback');
        var receiver = new ReceiverClass();
        var sender = new SenderClass();

        signal.connect(fn, receiver, sender);
        signal.emit(sender);

        expect(fn.mostRecentCall.object).toBe(receiver);
    });

    it('calls the callback function with correct arguments when invoking emit()', function() {
        var fn = jasmine.createSpy('signal callback');
        var receiver = new ReceiverClass();
        var sender = new SenderClass();

        signal.connect(fn, receiver, sender);
        signal.emit(sender, 'a', [1, 2, 3]);

        expect(fn).toHaveBeenCalledWith(sender, 'a', [1, 2, 3]);
    });

    it('calls the callback function when invoking emit() if the slot sender object is the sender', function() {
        var fn = jasmine.createSpy('signal callback');
        var receiver = new ReceiverClass();
        var sender = new SenderClass();

        signal.connect(fn, receiver, sender);
        signal.emit(sender);

        expect(fn).toHaveBeenCalled();
    });

    it('does not call the callback function when invoking emit() if the slot sender object is not the sender object', function() {
        var fn = jasmine.createSpy('signal callback');
        var receiver = new ReceiverClass();
        var sender = new SenderClass();

        signal.connect(fn, receiver, sender);
        signal.emit(new SenderClass());

        expect(fn).not.toHaveBeenCalled();
    });

    it('does not call the callback function when invoking emit() if the slot is disconencted by disconnect()', function() {
        var fn = jasmine.createSpy('signal callback');
        var receiver = new ReceiverClass();
        var sender = new SenderClass();

        signal.connect(fn, receiver, sender);
        signal.disconnect(fn, receiver, sender);
        signal.emit(sender);

        expect(fn).not.toHaveBeenCalled();
    });

    it('does not call the callback function when invoking emit() if the slot is disconencted by disconnectBySlot()', function() {
        var fn = jasmine.createSpy('signal callback');
        var receiver = new ReceiverClass();
        var sender = new SenderClass();
        var slot;

        slot = signal.connect(fn, receiver, sender);
        signal.disconnectBySlot(slot);
        signal.emit(sender);

        expect(fn).not.toHaveBeenCalled();
    });

    it('calls the callback function when invoking emitAsync()', function() {
        var receiver = new ReceiverClass();
        var sender = new SenderClass();
        var flag = false;

        receiver.fn = function() {
            flag = true;
        };
        spyOn(receiver, 'fn').andCallThrough();

        signal.connect(receiver.fn, receiver, sender);

        runs(function() {
            signal.emitAsync(sender);
        });

        waitsFor(function() {
            return flag;
        }, 'The callback should be called', 50);

        runs(function() {
            expect(receiver.fn).toHaveBeenCalled();
        });
    });
});

describe('Signal.markObj', function() {
    it('is defined', function() {
        expect(Signal.markObj).toBeDefined();
    });

    it('marks an object by injecting _signalObjId', function() {
        var o = {};

        Signal.markObj(o);
        expect(o._signalObjId).toBeDefined();
    });

});

describe('Signal.unmarkObj', function() {
    it('is defined', function() {
        expect(Signal.unmarkObj).toBeDefined();
    });

    it('unmarks an object by deleting _signalObjId', function() {
        var o = {
            _signalObjId: '1984-01-25'
        };

        Signal.unmarkObj(o);
        expect(o._signalObjId).not.toBeDefined();
    });
});
