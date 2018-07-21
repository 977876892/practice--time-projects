import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../common/common.service';
import { RefundsNoclientService } from './refundnoclient.service';
import { Router, ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-refundnoclient',
  templateUrl: './refundnoclient.component.html',
  styleUrls: ['./refundnoclient.component.css'],
  providers: [RefundsNoclientService, CommonService]
})
export class RefundnoclientComponent implements OnInit {
  clientName = 'NO CLIENT';
  refundtype: any = 'Service Refund';
  ElectronicPayment: any;
  Electronicdisabled = false;
  startDate: any;
  date = new Date();
  refundedBy: any;
  endDate: any;
  refundByError: any;
  refundSaveBut = false;
  refundTOData: any;
  dateError: any;
  totaltaxAmt: any;
  totalfixAmt: any;
  refundData: any;
  refundPostData: any;
  local: any;
  taxvalue = 0;
  amountMatcherror: any;
  totalAmt = 0;
  refund = [];
  refundto: any = false;
  searchList = false;
  refundSaveData = [];
  checkedData = [];
  servicelist = false;
  productlist = false;
  electroniclist = false;
  maxdate = new Date();
  datePickerConfig: any;
  constructor(private commonService: CommonService, private refundsNoclientService: RefundsNoclientService, private router: Router) {
    this.datePickerConfig = Object.assign({},
      {
        showWeekNumbers: false,
        containerClass: 'theme-blue',
      });
  }
  ngOnInit() {
    this.endDate = new Date(this.date.getTime());
    this.endDate.setDate(this.date.getDate() - 1);
    this.startDate = new Date(this.date.setMonth(this.date.getMonth() - 1));
    const local = JSON.parse(localStorage.getItem('browserObject'));
    if (localStorage.getItem('browserObject') === '' || localStorage.getItem('browserObject') === null) {
      this.local = 'N/A';
    } else {
      this.local = local.CashDrawer.split(' ')[0];
    }
  }
  refundtypeOnChange(value) {
    this.clear();
    this.refundto = false;
    this.refundSaveBut = false;
    this.checkedData = [];
    this.refundTOData = [];
    this.totalfixAmt = 0;
    this.totaltaxAmt = 0;
    this.totalAmt = 0;
    this.taxvalue = 0;
    this.searchList = false;
    if (value === 'Payment Overcharge') {
      this.ElectronicPayment = 'Electronic payments may only be refunded within 90 days.';
      this.Electronicdisabled = true;
    } else {
      this.ElectronicPayment = '';
      this.Electronicdisabled = false;
    }
  }
  refundSearch() {
    if (this.refundedBy === '' || this.refundedBy === null || this.refundedBy === undefined || this.refundedBy === 'undefined') {
      this.refundByError = 'CHECK_OUTS.REFUND.REFUND_BY';
    } else if ((this.Electronicdisabled === false) && (![this.startDate].every(Boolean) || this.startDate === null || isNaN(this.startDate))) {
      this.dateError = 'CHECK_OUTS.REFUND.BEGIN_DATE';
      this.startDate = '';
    } else if ((this.Electronicdisabled === false) && (![this.endDate].every(Boolean) || this.endDate === null || isNaN(this.endDate))) {
      this.dateError = 'CHECK_OUTS.REFUND.END_DATE';
      this.endDate = '';
    } else if ((this.Electronicdisabled === false) &&
      (this.startDate !== '' && this.startDate !== null && this.startDate !== undefined && !isNaN(this.startDate)) &&
      (this.endDate !== '' && this.endDate !== null && this.endDate !== undefined && !isNaN(this.endDate)) &&
      (this.startDate > this.endDate)) {
      this.dateError = 'CHECK_OUTS.REFUND.BEGIN_DATE_A_E_D';
    } else {
      const refunddata = {
        id: 'no client',
        type: this.refundtype,
        refundedBy: this.refundedBy,
        startDate: this.commonService.getDBDatTmStr(this.startDate).split(' ')[0],
        endDate: this.commonService.getDBDatTmStr(this.endDate).split(' ')[0]
      };
      this.refundsNoclientService.getRefund(refunddata)
        .subscribe(data => {
          this.refundData = data['result'];
          this.refundData.forEach(element => {
            element.oldAmt = element.Net_Price__c;
          });
          this.searchList = true;
          if (this.refundtype === 'Service Refund') {
            this.servicelist = true;
            this.productlist = false;
            this.electroniclist = false;
          } else if (this.refundtype === 'Product Refund') {
            this.productlist = true;
            this.servicelist = false;
            this.electroniclist = false;
          } else if (this.refundtype === 'Payment Overcharge') {
            this.electroniclist = true;
            this.productlist = false;
            this.servicelist = false;
          }
        }, error => {
          const status = JSON.parse(error['status']);
          const statuscode = JSON.parse(error['_body']).status;
          switch (JSON.parse(error['_body']).status) {
            case '2033':
              window.scrollTo(0, 0);
              break;
          }
          if (statuscode === '2085' || statuscode === '2071') {
            if (this.router.url !== '/') {
              localStorage.setItem('page', this.router.url);
              this.router.navigate(['/']).then(() => { });
            }
          }
        });

    }
  }

  calculateRefundAmount(value, item, i) {
    if (value === true) {
      this.taxvalue = 0;
      this.totalAmt = 0;
      this.refundsNoclientService.getRefundTO(item)
        .subscribe(data => {
          this.refund = data['result'];
          this.refund.forEach(element => {
            element.OriginalPaymentAmount = element.Amount_Paid__c;
          });
          if (this.refund.length > 0) {
            this.refundTOData = this.refund;
            this.refundSaveBut = true;
          }
        }, error => {
          const status = JSON.parse(error['status']);
          const statuscode = JSON.parse(error['_body']).status;
          switch (JSON.parse(error['_body']).status) {
            case '2033':
              window.scrollTo(0, 0);
              break;
          }
          if (statuscode === '2085' || statuscode === '2071') {
            if (this.router.url !== '/') {
              localStorage.setItem('page', this.router.url);
              this.router.navigate(['/']).then(() => { });
            }
          }
        });

      this.refundto = true;
      this.refundData.forEach((element, index) => {
        if (element.apptName === item.apptName) {
          element.seleCheckBox = false;
        } else {
          element.seleCheckBox = true;
        }
        if (element.selectVal === true) {
          element.selectVal = true;
        } else {
          element.selectVal = false;
        }
        if ((element.selectVal === true) && (element.apptName !== item.apptName)) {
          element.selectVal = false;
          this.totalAmt = 0;
          this.taxvalue = 0;
          this.totalfixAmt = 0;
          this.totaltaxAmt = 0;
          this.checkedData = [];
          this.refundSaveData = [];
        }
      });
      if (this.refundtype === 'Service Refund') {
        for (let t = 0; t < this.refundData.length; t++) {
          if (this.refundData[t].Service_Tax__c === null) {
            this.refundData[t].Service_Tax__c = 0;
          }
          if (this.refundData[t].selectVal === true && this.refundData[t].Taxable__c === 1) {
            this.taxvalue += (this.refundData[t].Net_Price__c / this.refundData[t].oldAmt) * this.refundData[t].Service_Tax__c;
          }
          if (this.refundData[t].selectVal === true && this.refundData[t].oldAmt !== 0) {
            let ser_tax = 0;
            if (this.refundData[t].Taxable__c === 1) {
              ser_tax = this.refundData[t].Service_Tax__c;
            } else { ser_tax = 0; }
            this.totalAmt += this.refundData[t].Net_Price__c + (this.refundData[t].Net_Price__c / this.refundData[t].oldAmt) * ser_tax;
          }
        }
      } else if (this.refundtype === 'Product Refund') {
        for (let t = 0; t < this.refundData.length; t++) {
          if (this.refundData[t].Product_Tax__c === null) {
            this.refundData[t].Product_Tax__c = 0;
          }
          if (this.refundData[t].selectVal === true && this.refundData[t].Taxable__c === 1) {
            this.taxvalue += (this.refundData[t].Net_Price__c / this.refundData[t].oldAmt) * this.refundData[t].Product_Tax__c;
          }
          if (this.refundData[t].selectVal === true && this.refundData[t].oldAmt !== 0) {
            let ser_tax = 0;
            if (this.refundData[t].Taxable__c === 1) {
              ser_tax = this.refundData[t].Product_Tax__c;
            } else { ser_tax = 0; }
            this.totalAmt += this.refundData[t].Net_Price__c + (this.refundData[t].Net_Price__c / this.refundData[t].oldAmt) * ser_tax;
          }
        }
      }
      this.totaltaxAmt = this.taxvalue.toFixed(2);
      this.totalfixAmt = this.totalAmt.toFixed(2);

    } else if (value === false) {
      this.amountMatcherror = '';
      if (this.refundtype === 'Service Refund') {
        for (let t = 0; t < this.refundData.length; t++) {
          if (i === t && this.refundData[t].oldAmt !== 0) {
            let ser_tax = 0;
            if (this.refundData[t].Taxable__c === 1) {
              ser_tax = this.refundData[t].Service_Tax__c;
              this.taxvalue -= (this.refundData[t].Net_Price__c / this.refundData[t].oldAmt) * this.refundData[t].Service_Tax__c;
            } else { ser_tax = 0; }
            this.totalAmt -= this.refundData[t].Net_Price__c + (this.refundData[t].Net_Price__c / this.refundData[t].oldAmt) * ser_tax;
          }
        }
      } else if (this.refundtype === 'Product Refund') {
        for (let t = 0; t < this.refundData.length; t++) {
          if (i === t && this.refundData[t].oldAmt !== 0) {
            let ser_tax = 0;
            if (this.refundData[t].Taxable__c === 1) {
              ser_tax = this.refundData[t].Product_Tax__c;
              this.taxvalue -= (this.refundData[t].Net_Price__c / this.refundData[t].oldAmt) * this.refundData[t].Product_Tax__c;
            } else { ser_tax = 0; }
            this.totalAmt -= this.refundData[t].Net_Price__c + (this.refundData[t].Net_Price__c / this.refundData[t].oldAmt) * ser_tax;
          }
        }
      }
      this.totaltaxAmt = this.taxvalue.toFixed(2);
      this.totalfixAmt = this.totalAmt.toFixed(2);
      if (this.totaltaxAmt === '-0.00' || this.totaltaxAmt === '0.00') {
        this.totaltaxAmt = 0;
      }
      if (this.totalfixAmt === '-0.00' || this.totalfixAmt === '0.00') {
        this.totalfixAmt = 0;
      }

      const uncheck = this.refundData.filter(function (obj) {
        return obj.selectVal === true;
      });
      if (uncheck.length === 0) {
        this.refundto = false;
        this.refundSaveBut = false;
        this.refundTOData = [];
        this.refundData.forEach((element, index) => {
          element.seleCheckBox = false;
        });
      } else {
        this.refundto = true;
        this.refundData.forEach((element, index) => {
          if (element.apptName === item.apptName) {
            element.seleCheckBox = false;
          } else {
            element.seleCheckBox = true;
          }
        });
      }
    }
  }
  clear() {
    this.refundByError = '';
    this.dateError = '';
    this.amountMatcherror = '';
  }
  RefundToSave() {
    let toref = 0;
    this.checkedData = [];
    this.refundSaveData = [];
    this.refundTOData.forEach((element, index) => {
      if (index === 0) {
        toref = element.Amount_Paid__c;
      } else {
        toref += element.Amount_Paid__c;
      }
      if (element.Amount_Paid__c !== 0 && element.Amount_Paid__c !== 0.00 && element.Amount_Paid__c !== null) {
        this.refundSaveData.push({
          'PaymentType': element.Name,
          'AmountToRefund': element.Amount_Paid__c,
          'OriginalPaymentAmount': element.OriginalPaymentAmount,
          'MerchantAccountName': element.Merchant_Account_Name__c,
          'ReferenceNumber': element.Reference_Number__c,
          'Id': element.Id
        });
      }
    });
    for (let t = 0; t < this.refundData.length; t++) {
      if (this.refundData[t].selectVal === true) {
        if (this.refundtype === 'Product Refund') {
          if (this.refundData[t].deductFromWorker === true) {
            this.refundData[t].deductFromWorker = 1;
          } else if (this.refundData[t].deductFromWorker === false) {
            this.refundData[t].deductFromWorker = 0;
          }
          if (this.refundData[t].returnToInventory === true) {
            this.refundData[t].returnToInventory = 1;
          } else if (this.refundData[t].returnToInventory === false) {
            this.refundData[t].returnToInventory = 0;
          }
          this.checkedData.push({
            'ProductId': this.refundData[t].Product__c, 'WorkerId': this.refundData[t].Worker__c, 'Taxable': this.refundData[t].Taxable__c,
            'deductFromWorker': this.refundData[t].deductFromWorker, 'Amount': this.refundData[t].Net_Price__c, 'Ticket#': this.refundData[t].apptName,
            'Product': this.refundData[t].Name, 'Quantity': this.refundData[t].Qty_Sold__c,
            'Product_Tax__c': this.refundData[t].Product_Tax__c === null ? 0 :
              (this.refundData[t].Net_Price__c / (this.refundData[t].oldAmt) * this.refundData[t].Product_Tax__c).toFixed(2),
            'ReturntoInventory': this.refundData[t].returnToInventory, 'Date': this.refundData[t].Service_Date_Time__c, 'id': this.refundData[t].Id
          });
        } else if (this.refundtype === 'Service Refund') {
          if (this.refundData[t].deductFromWorker === true) {
            this.refundData[t].deductFromWorker = 1;
          } else if (this.refundData[t].deductFromWorker === false) {
            this.refundData[t].deductFromWorker = 0;
          }
          this.checkedData.push({
            'ServiceId': this.refundData[t].Service__c, 'WorkerId': this.refundData[t].Worker__c, 'Taxable': this.refundData[t].Taxable__c,
            'deductFromWorker': this.refundData[t].deductFromWorker, 'Amount': this.refundData[t].Net_Price__c,
            'Service_Tax': this.refundData[t].Service_Tax__c === null ? 0 :
              ((this.refundData[t].Net_Price__c / this.refundData[t].oldAmt) * this.refundData[t].Service_Tax__c).toFixed(2),
            'Date': this.refundData[t].Service_Date_Time__c, 'id': this.refundData[t].Id, 'Service_Group_Color__c': this.refundData[t].Service_Group_Color__c
          });
        } else if (this.refundtype === 'Payment Overcharge') {
          this.checkedData.push({
            'AmountPaid': this.refundData[t].Amount_Paid__c, 'PaymentType': this.refundData[t].Name,
            'Service_Tax': this.refundData[t].Service_Tax__c === null ? 0 : this.refundData[t].Service_Tax__c,
            'Date': this.refundData[t].Appt_Date_Time__c, 'Ticket': this.refundData[t].apptName, 'Status_c': this.refundData[t].Status__c,
            'Payments_c': this.refundData[t].Payments__c, 'Current_Balance_c': this.refundData[t].Current_Balance__c, 'id': this.refundData[t].Id
          });
        }
      }
    }
    const saveRec = {
      clientId: 'no client',
      clientname: this.clientName,
      refundType: this.refundtype,
      totalAmt: this.totalfixAmt,
      selectList: this.checkedData,
      Drawer_Number__c: this.local !== 'N/A' ? this.local : '',
      refundToList: this.refundSaveData,
      Appt_Date_Time__c: this.commonService.getDBDatTmStr(new Date())
    };
    if (this.refundtype === 'Service Refund' || this.refundtype === 'Product Refund') {
      if (this.totalfixAmt === toref.toFixed(2).toString()) {
        this.amountMatcherror = '';
        this.refundsNoclientService.postRefundData(saveRec)
          .subscribe(data => {
            this.refundPostData = data;
            this.router.navigate(['/checkout']);
          }, error => {
            const status = JSON.parse(error['status']);
            const statuscode = JSON.parse(error['_body']).status;
            switch (JSON.parse(error['_body']).status) {
              case '2033':
                window.scrollTo(0, 0);
                break;
            }
            if (statuscode === '2085' || statuscode === '2071') {
              if (this.router.url !== '/') {
                localStorage.setItem('page', this.router.url);
                this.router.navigate(['/']).then(() => { });
              }
            }
          });
      } else {
        this.amountMatcherror = 'CHECK_OUTS.REFUND.AMOUNT_NOT_MATCH';
      }
    } else if (this.refundtype === 'Payment Overcharge') {
      this.refundsNoclientService.postRefundData(saveRec)
        .subscribe(data => {
          this.refundPostData = data;
          this.router.navigate(['/checkout']);
        }, error => {
          const status = JSON.parse(error['status']);
          const statuscode = JSON.parse(error['_body']).status;
          switch (JSON.parse(error['_body']).status) {
            case '2033':
              window.scrollTo(0, 0);
              break;
          }
          if (statuscode === '2085' || statuscode === '2071') {
            if (this.router.url !== '/') {
              localStorage.setItem('page', this.router.url);
              this.router.navigate(['/']).then(() => { });
            }
          }
        });
    }
  }


}