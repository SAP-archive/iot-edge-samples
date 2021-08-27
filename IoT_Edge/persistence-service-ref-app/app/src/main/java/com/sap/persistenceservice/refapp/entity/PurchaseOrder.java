package com.sap.persistenceservice.refapp.entity;

import java.io.Serializable;
import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.sap.persistenceservice.refapp.utils.Constants;

@Entity
@Table(name = Constants.PURCHASE_ORDER)
public class PurchaseOrder implements Serializable {

    /**
     * 
     */
    private static final long serialVersionUID = 1892054229860833493L;

    @Column(name = "id")
    @Id
    @JsonProperty("id")
    private Integer id;

    @Column(name = "name")
    @JsonProperty("name")
    private String name;

    @Column(name = "quantity")
    @JsonProperty("quantity")
    private int quantity;

    public PurchaseOrder() {
    }

    public PurchaseOrder(int id, String name, int quantity) {
        this.id = id;
        this.name = name;
        this.quantity = quantity;
    }

    /**
     * @return the id
     */
    public Integer getId() {
        return id;
    }

    /**
     * @return the name
     */
    public String getName() {
        return name;
    }

    /**
     * @return the quantity
     */
    public int getQuantity() {
        return quantity;
    }

}
