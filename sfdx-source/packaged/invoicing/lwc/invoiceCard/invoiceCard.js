import { LightningElement, api, track } from 'lwc';

const PICK_VAL_DRAFT = 'Draft';
const PICK_VAL_ACTIVATED = 'Activated';
const PICK_VAL_CANCELLED = 'Cancelled';

export default class InvoiceCard extends LightningElement {

    @track record;
    @track internalLineItems = [];

    @track TotalAmount = 0;
    @track TotalGrossAmount = 0;

    // used to construct the next line item id
    incremetor = 0;

    @api
    get invoiceWrapper() {
        return null;
    }
    set invoiceWrapper(value) {
        this.TotalAmount = value.Record.TotalAmount__c;
        this.TotalGrossAmount = value.Record.TotalGrossAmount__c;

        this.record = {
            Id : value.Record.Id,
            Date__c : value.Record.Date__c,
            ServicePeriodTo__c : value.Record.ServicePeriodTo__c,
            ServicePeriodFrom__c : value.Record.ServicePeriodFrom__c,
            Account__r : { Name : value.Record.Account__r.Name },
            Status__c : value.Record.Status__c,
            Name : value.Record.Name,
            TotalAmount__c : value.Record.TotalAmount__c,
            TotalGrossAmount__c : value.Record.TotalGrossAmount__c
        }

        value.LineItems.forEach(
            (item) => {
                let newItem = {
                    Record : {
                        Id : item.Record.Id,
                        Price__c : item.Record.Price__c,
                        Discount__c : item.Record.Discount__c,
                        Tax__c : item.Record.Tax__c,
                        Quantity__c : item.Record.Quantity__c,
                        Product__c : item.Record.Product__c,
                        Productname__c : item.Record.Productname__c
                    },
                    ExtId : this.nextLineItemId()
                }
                this.internalLineItems.push(newItem);
            }
        );
    }

    handleDateInput(event) {
        this.record.Date__c = event.detail.value;
        this.dispatchUpdateEvent();
    }

    handleServicePeriodFromInput(event) {
        this.record.ServicePeriodFrom__c = event.detail.value;
        this.dispatchUpdateEvent();
    }

    handleServicePeriodToInput(event) {
        this.record.ServicePeriodTo__c = event.detail.value;
        this.dispatchUpdateEvent();
    }

    handleActivateButtonClick() {
        this.isActivated ? this.record.Status__c = PICK_VAL_DRAFT : this.record.Status__c = PICK_VAL_ACTIVATED;
        this.dispatchUpdateEvent();
    }

    handleCancelButtonClick() {
        this.isCancelled ? this.record.Status__c = PICK_VAL_DRAFT : this.record.Status__c = PICK_VAL_CANCELLED;
        this.dispatchUpdateEvent();
    }

    recalculateSums(event) {
        this.TotalAmount = event.detail.sumAmount;
        this.TotalGrossAmount = event.detail.sumGrossAmount;
    }

    addLineItem() {
        var newItem = this.NewLineItem;
        this.internalLineItems.push(newItem);

        this.dispatchEvent(
            new CustomEvent('lineitemcreate', { detail : newItem })
        );
    }

    get isActivated() {
        return this.record.Status__c === PICK_VAL_ACTIVATED;
    }

    get isCancelled() {
        return this.record.Status__c === PICK_VAL_CANCELLED;
    }

    get invoiceTitle() {
        return this.record.Account__r.Name+ ' - ' + this.record.Name;
    }

    get TotalTaxes() {
        return this.TotalGrossAmount - this.TotalAmount;
    }

    get NewLineItem() {
        return {
            Record : {
                Invoice__c : this.record.Id,
                Discount__c : 0.00,
                Tax__c : 0.00,
                Quantity__c : 0.00,
                Price__c : 0.00
            },
            ExtId : this.nextLineItemId()
        };
    }

    dispatchUpdateEvent() {
        this.dispatchEvent(
            new CustomEvent('invoicechange', { detail : this.record })
        );
    }

    bubbleLineItemChange(event) {
        this.dispatchEvent(
            new CustomEvent('lineitemchange', { detail : event.detail })
        );
    }

    bubbleLineItemDelete(extId, recordId) {
        this.dispatchEvent(
            new CustomEvent('lineitemdelete', { detail : {extId : extId, recordId : recordId} })
        );
    }

    removeLineItem(event) {

        let newLineItems = this.internalLineItems.filter((value) => {
            if (value.ExtId !== event.detail) {
                return true;
            }
            this.bubbleLineItemDelete(event.detail, value.Record.Id);
            return false;
        });

        this.internalLineItems = newLineItems;
    }

    nextLineItemId() {
        return this.record.Id +'-'+(this.incremetor++);
    }
}