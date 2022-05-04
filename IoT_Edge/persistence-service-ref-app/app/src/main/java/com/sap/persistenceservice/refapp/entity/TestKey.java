package com.sap.persistenceservice.refapp.entity;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Embeddable;

import lombok.EqualsAndHashCode;

@Embeddable
@EqualsAndHashCode
public class TestKey implements Serializable {

    /**
     * 
     */
    private static final long serialVersionUID = -8207845650301338860L;

    @Column(name = "TEST_ID", nullable = false)
    private String testId;

    @Column(name = "TEST_SEQUENCE", nullable = false)
    private int sequence;

    public String getTestId() {
        return testId;
    }

    public void setTestId(String testId) {
        this.testId = testId;
    }

    public int getSequence() {
        return sequence;
    }

    public void setSequence(int sequence) {
        this.sequence = sequence;
    }
}
