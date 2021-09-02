package com.sap.persistenceservice.refapp.utils;

import java.util.Calendar;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

public class MessageUtil {

    private static AtomicLong startTime;

    private static AtomicInteger maxMessageCounter = new AtomicInteger(0);

    private static class InstanceHolder {
        private static MessageUtil instance = new MessageUtil();
    }

    private MessageUtil() {
    }

    public static MessageUtil getInstance() {
        return InstanceHolder.instance;
    }

    public synchronized void initStartTime() {

        if (startTime == null) {
            startTime = new AtomicLong(Calendar.getInstance().getTimeInMillis());
        }
    }

    public synchronized void reset() {
        startTime = null;
        maxMessageCounter.set(0);
    }

    public AtomicLong getStartTime() {
        return startTime;
    }

    public void incrementMessageCounter() {
        maxMessageCounter.incrementAndGet();
    }

    public long getMessageCounter() {
        return maxMessageCounter.longValue();
    }

}
