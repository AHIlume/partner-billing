import { LightningElement, api, track } from 'lwc';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getInvoice from '@salesforce/apex/InvoiceController.getInvoice';
import commitInvoiceLineItems from '@salesforce/apex/InvoiceController.commitInvoiceLineItems';

import TOAST_TITLE_ERROR from '@salesforce/label/c.Toast_Title_GenericError';
import TOAST_TITLE_SUCCESS from '@salesforce/label/c.Toast_Title_LineItemsUpdated';
export default class InvoiceCardRecord extends LightningElement {
    @api recordId;
    @track hasError = false;
    @track isWorking = true;
    @track allLineItems = [];

    dirtyLineItems = new Map();
    deletedLineItems = new Set();

    LABELS = {
        TOAST_TITLE_ERROR,
        TOAST_TITLE_SUCCESS
    }

    connectedCallback() {
        this.getLineItemData();
    }

    removeLineItem(event) {

        let newLineItems = this.allLineItems.filter((value) => {
            if (value.ExtId !== event.detail) {
                return true;
            }
            if (this.dirtyLineItems.has(value.ExtId)) this.dirtyLineItems.delete(value.ExtId);
            if (value.Record.Id && value.Record.Id) this.deletedLineItems.add(value.Record.Id);
            return false;
        });

        this.allLineItems = newLineItems;
    }

    updateLineItem(event) {
        if (!this.dirtyLineItems.has(event.detail.extId)) this.dirtyLineItems.set(event.detail.extId, {});
        let record = this.dirtyLineItems.get(event.detail.extId);
        record[event.detail.field] = event.detail.newValue;
        record.Id = event.detail.recordId;
        //console.log('Updated Record: ' + JSON.stringify(record));
    }

    addNewLineItem() {
        var newItem = this.NewLineItem;
        this.allLineItems.push(newItem);
        this.dirtyLineItems.set(newItem.ExtId, newItem.Record);
    }

    commitLineItems() {
        this.isWorking = true;
        commitInvoiceLineItems({
            recordId : this.recordId,
            lineItemsToUpsert : this.upsertList,
            lineItemsToDelete : this.deleteList
        })
        .then( () => {
            this.dirtyLineItems = new Map();
            this.deletedLineItems = new Set();
            updateRecord({ fields: { Id: this.recordId } });
            this.dispatchToast('success', TOAST_TITLE_SUCCESS);
            this.isWorking = false;
        })
        .catch( (error) => {
            this.dispatchToast('error', TOAST_TITLE_ERROR, error.body.message);
            this.hasError = true;
            this.isWorking = false;
        });
    }

    resetLineItems() {
        this.getLineItemData();
    }

    get NewLineItem() {
        return {
            Record : {
                Invoice__c : this.recordId,
                Discount__c : 0.00,
                Tax__c : 0.00,
                Quantity__c : 0.00,
                Price__c : 0.00
            },
            ExtId : this.nextLineItemId()
        };
    }

    get deleteList() {
        let arr = [];
        for (let item of this.deletedLineItems) { arr.push(item); }
        return arr;
    }

    get upsertList() {
        let arr = [];
        this.dirtyLineItems.forEach( (value) => { arr.push(value); });
        return arr;
    }

    incremetor = 0;
    nextLineItemId() {
        return this.recordId +'-'+(this.incremetor++);
    }

    getLineItemData() {
        this.isWorking = true;
        getInvoice({
            recordId : this.recordId
        })
        .then((result) => {
            this.allLineItems = result.LineItems;
            this.allLineItems.forEach(
                (item) => { item.ExtId = this.nextLineItemId(); }
            );

            this.isWorking = false;
        })
        .catch(() => {
            this.hasError = true;
            this.isWorking = false;
        })
    }

    dispatchToast(toastVariant, toastTitle, toastMessage) {
        let toast = new ShowToastEvent({
            title : toastTitle,
            message : toastMessage,
            variant : toastVariant
        });
        this.dispatchEvent(toast);
    }

}