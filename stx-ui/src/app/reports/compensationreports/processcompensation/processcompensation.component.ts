import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { SafeUrl, DomSanitizer } from '@angular/platform-browser';
import { ProcessCompensationService } from './processcompensation.service';
import { SetupCompMethodService } from '../../../setup/setupworkers/setupcompensationmethod/setupcompmethod.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from 'ng2-translate';
import { CommonService } from '../../../common/common.service';
@Component({
  selector: 'app-reports-app',
  templateUrl: './processcompensation.html',
  styleUrls: ['./processcompensation.css'],
  providers: [ProcessCompensationService, CommonService, SetupCompMethodService],
})
export class ProcessCompensationComponent implements OnInit {
  startDate: any;
  endDate: any;
  minDate = new Date();
  datePickerConfig: any;
  error: any;
  processCompObj = [];
  totalCount = 0;
  topBarButt = false;
  arcButt = false;
  resetButt = false;
  archiveRecored = [];
  fullview = false;
  datePicDis = false;
  fullviewSetup = false;
  viewList: any;
  viewResdata = [];
  finAry = [];
  generateData = [];
  generateListRecored = [];
  generatRebookedServices = [];
  generateTicketCounts = [];
  generatProductSalesByProductLine = [];
  totalGrossServiceAmo = 0;
  scalesData = [];
  generatServiceSalesByServiceGroup = [];
  generatproductSalesByInventoryGroup = [];
  constructor(private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private translateService: TranslateService, private commonservice: CommonService,
    private setupCompMethodService: SetupCompMethodService,
    private processCompensationService: ProcessCompensationService) {
    this.datePickerConfig = Object.assign({},
      {
        showWeekNumbers: false,
        containerClass: 'theme-blue',
      });
  }
  ngOnInit() {
    // this.toastr.info('Please select Begin Date & End Date', null, { timeOut: 3000 });
  }

  selectAll() {
    this.processCompObj = this.processCompObj.map(function (item, index) {
      item['include'] = 1;
      return item;
    });
  }

  unSelectAll() {
    this.processCompObj = this.processCompObj.map(function (item, index) {
      item['include'] = 0;
      return item;
    });
  }

  generateReport() {
    this.resetButt = false;
    this.fullview = false;
    if (!this.startDate) {
      this.toastr.warning('Please select Begin Date', null, { timeOut: 3000 });
      this.processCompObj = [];
      // this.error = 'Begin Date is required';
    } else if (!this.endDate) {
      this.toastr.warning('Please select End Date', null, { timeOut: 3000 });
      this.processCompObj = [];
      // this.error = 'End Date is required';
    } else if (this.startDate > this.endDate) {
      this.toastr.warning('Begin Date must be before the End Date', null, { timeOut: 3000 });
      this.processCompObj = [];
      // this.error = 'TOTAL_SHEETS.BEGIN_DATE_SHOULD_BE_AFTER_END_DATE';
    } else {
      this.processCompensationService.workerCompensationList(this.startDate, this.endDate).subscribe(
        data => {
          this.processCompObj = data['result'][0];
          this.totalCount = data['result'][1];
          if (this.processCompObj.length === 0) {
            this.toastr.warning('No results found', null, { timeOut: 3000 });
          }
          const notEmpty = this.processCompObj.filter(function (obj) {
            return obj.id !== '';
          });
          if (notEmpty.length > 0) {
            this.resetButt = true;
            this.fullview = true;
            this.archiveRecored = [];
            for (let i = 0; i < notEmpty.length; i++) {
              if (notEmpty[i].id !== '') {
                this.archiveRecored.push({
                  'Id': notEmpty[i].id,
                  'workerId': notEmpty[i].workerId
                });
              }
            }
          }
        },
        error => {
          const status = JSON.parse(error['status']);
          const statuscode = JSON.parse(error['_body']).status;
          switch (status) {
            case 500:
              break;
            case 400:
              break;
          }
          if (statuscode === '2085' || statuscode === '2071') {
            if (this.router.url !== '/') {
              localStorage.setItem('page', this.router.url);
              this.router.navigate(['/']).then(() => { });
            }
          }
        }
      );
    }
  }

  printDiv() {
    const divContents = document.getElementById('dvContents').innerHTML;
    const printWindow = window.open('', '');
    printWindow.document.write('<html><head><title>Process Compensation Report</title>');
    printWindow.document.write('</head><body style="color: black">');
    printWindow.document.write(divContents);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  }

  archiveButt() {
    const archiveObj = {
      'sDate': this.startDate.getFullYear() + '-' + (this.startDate.getMonth() + 1) + '-' + this.startDate.getDate(),
      'eDate': this.endDate.getFullYear() + '-' + (this.endDate.getMonth() + 1) + '-' + this.endDate.getDate(),
      'archiveArrObj': this.processCompObj.filter((obj) => obj.include === 1 || obj.include === true)
    };
    if (archiveObj.archiveArrObj.length > 0) {
      this.processCompensationService.archiveSer(archiveObj).subscribe(
        data => {
          this.archiveRecored = [];
          this.archiveRecored = data['result'];
          for (let i = 0; i < this.processCompObj.length; i++) {
            this.archiveRecored.forEach(element => {
              if (this.processCompObj[i].workerId === element.workerId) {
                this.processCompObj[i].id = element.Id;
              }
            });
          }
          this.resetButt = true;
          this.arcButt = false;
          this.fullview = true;
        },
        error => {
          const status = JSON.parse(error['status']);
          const statuscode = JSON.parse(error['_body']).status;
          switch (status) {
            case 500:
              break;
            case 400:
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

  resetFun() {
    if (this.archiveRecored.length > 0) {
      this.processCompensationService.resetSer(this.archiveRecored).subscribe(
        data => {
          const resetData = data['result'];
          this.generateReport();
        },
        error => {
          const status = JSON.parse(error['status']);
          const statuscode = JSON.parse(error['_body']).status;
          switch (status) {
            case 500:
              break;
            case 400:
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

  view(item) {
    this.processCompensationService.workerCompensationList(this.startDate, this.endDate).subscribe(
      data => {
        if (data['result'][0].length > 0) {
          this.viewList = data['result'][0].filter(function (obj) { return obj.workerId === item.workerId; })[0];
        }
        this.generateFun(this.viewList);
      },
      error => {
        const status = JSON.parse(error['status']);
        const statuscode = JSON.parse(error['_body']).status;
        switch (status) {
          case 500:
            break;
          case 400:
            break;
        }
        if (statuscode === '2085' || statuscode === '2071') {
          if (this.router.url !== '/') {
            localStorage.setItem('page', this.router.url);
            this.router.navigate(['/']).then(() => { });
          }
        }
      }
    );
  }
  generateButt() {
    this.topBarButt = true;
    const notEmpty = this.processCompObj.filter(function (obj) {
      return obj.id !== '';
    });
    if (notEmpty.length === 0) {
      this.arcButt = true;
    }
    this.generateFun('');
  }
  generateFun(item) {
    const dateObj = {
      'stdate': this.startDate.getFullYear() + '-' + (this.startDate.getMonth() + 1) + '-' + this.startDate.getDate(),
      'eddate': this.endDate.getFullYear() + '-' + (this.endDate.getMonth() + 1) + '-' + this.endDate.getDate(),
    };
    this.processCompensationService.generateData(dateObj).subscribe(
      data => {
        this.generateData = data['result']['serviceSalesByClientFlags'];
        this.generatRebookedServices = data['result']['RebookedServicesByDateRange'];
        this.generateTicketCounts = data['result']['ticketCounts'];
        this.generatProductSalesByProductLine = data['result']['productSalesByProductLine'];
        this.generatServiceSalesByServiceGroup = data['result']['serviceSalesByServiceGroup'];
        this.generatproductSalesByInventoryGroup = data['result']['productSalesByInventoryGroup'];
        for (let p = 0; p < this.processCompObj.length; p++) {
          let guestChargeTotal = 0;
          let serviceAmountTotal = 0;
          let nbrOfServices = 0;
          let rebookedserviceamount = 0;
          let rebookedguestcharge = 0;
          let rebookedservicenumber = 0;
          // serviceSalesByClientFlags loop
          for (let g = 0; g < this.generateData.length; g++) {
            if (this.generateData[g].workerId === this.processCompObj[p].workerId) {
              guestChargeTotal += this.generateData[g].guestCharge ? Number(this.generateData[g].guestCharge) : 0;
              serviceAmountTotal += this.generateData[g].serviceAmount ? Number(this.generateData[g].serviceAmount) : 0;
              nbrOfServices += this.generateData[g].numberOfServices ? Number(this.generateData[g].numberOfServices) : 0;
              this.processCompObj[p]['grossService'] = serviceAmountTotal - guestChargeTotal;
              this.processCompObj[p]['numberOfServices'] = nbrOfServices;
            }
          }

          // RebookedServicesByDateRange loop
          for (let g = 0; g < this.generatRebookedServices.length; g++) {
            if (this.generatRebookedServices[g].workerId === this.processCompObj[p].workerId) {
              if (this.generatRebookedServices[g].rebookedGuestCharge) {
                rebookedserviceamount += this.generatRebookedServices[g].rebookedServiceAmount;
                rebookedguestcharge += this.generatRebookedServices[g].rebookedGuestCharge;
                this.processCompObj[p]['rebookedServiceAmount'] = rebookedserviceamount - rebookedguestcharge;
              } else {
                this.processCompObj[p]['rebookedServiceAmount'] = this.generatRebookedServices[g].rebookedServiceAmount;
              }
              rebookedservicenumber += this.generatRebookedServices[g].rebookedServiceCount;
              this.processCompObj[p]['rebookedServiceNumber'] = rebookedservicenumber;
            }
          }

        }
        if (item) {
          this.fullviewRes(item);
        }
        // this.generateListRecored = this.commonservice.removeDuplicates(this.processCompObj, 'workerId');
      },
      error => {
        const status = JSON.parse(error['status']);
        const statuscode = JSON.parse(error['_body']).status;
        if (statuscode === '2085' || statuscode === '2071') {
          if (this.router.url !== '/') {
            localStorage.setItem('page', this.router.url);
            this.router.navigate(['/']).then(() => { });
          }
        }
      });
  }
  fullviewRes(item) {
    this.processCompensationService.fullview(item.id, item.workerId, this.startDate, this.endDate).subscribe(
      data => {
        const temp1 = data['result']['result1'][0];
        const temp2 = data['result']['result1'][1];
        const temp3 = data['result']['result1'][2];
        const temp4 = data['result']['result'][4];
        this.finAry = [];
        for (let i = 0; i < temp1.length; i++) {
          this.finAry.push({
            'date': temp1[i]['serviceDate'],
            'services': Number(temp1[i]['serviceTotal']) - Number(temp1[i].guestCharge),
            'classes': 0.00,
            'products': 0.00,
            'hoursWorked': 0
          });
        }
        for (let i = 0; i < temp2.length; i++) {
          let param = false;
          for (let j = 0; j < this.finAry.length; j++) {
            if (temp2[i]['productDate'] === this.finAry[j]['date']) {
              param = true;
              this.finAry[j]['products'] = temp2[i]['productTotal'];
              break;
            }
          }
          if (!param) {
            this.finAry.push({
              'date': temp2[i]['productDate'],
              'services': 0.00,
              'classes': 0.00,
              'products': temp2[i]['productTotal'],
              'hoursWorked': 0
            });
          }
        }
        for (let i = 0; i < temp3.length; i++) {
          let param = false;
          for (let j = 0; j < this.finAry.length; j++) {
            if (temp3[i]['workDate'] === this.finAry[j]['date']) {
              param = true;
              this.finAry[j]['hoursWorked'] = temp3[i]['hoursWorked'];
              break;
            }
          }
          if (!param) {
            this.finAry.push({
              'date': temp3[i]['workDate'],
              'services': 0.00,
              'classes': 0.00,
              'products': 0.00,
              'hoursWorked': temp3[i]['hoursWorked']
            });
          }
        }
        if (this.finAry.length > 0) {
          this.finAry.forEach(element => {
            this.totalGrossServiceAmo += element.services ? Number(element.services) : 0;
          });
        }
        this.viewResdata = JSON.parse(data['result']['result'][0][0].Steps__c);

        // for (let i = 0; i < this.viewResdata.length; i++) {
        //   if (this.viewResdata[i]['operand'] === 'Hourly Wage') {
        //     this.viewResdata[i]['result'] = data['result']['result'][0][0]['Hourly_Wage__c'];
        //   } else if (this.viewResdata[i]['operand'] === 'Hours Worked') {
        //     this.viewResdata[i]['result'] = !data['result']['result'][0][0]['Regular_Hours__c'] ? 0 : Number(data['result']['result'][0][0]['Regular_Hours__c']) +
        //       (!data['result']['result'][0][0]['Overtime_Hours__c'] ? 0 : Number(data['result']['result'][0][0]['Overtime_Hours__c']) * 1.5);
        //   } else if (this.viewResdata[i]['operand'] === 'Days Worked') {
        //     this.viewResdata[i]['result'] = data['result']['result'][0][0]['Days_Worked__c'];
        //   } else if (this.viewResdata[i]['operand'] === 'Salary') {
        //     this.viewResdata[i]['result'] = data['result']['result'][0][0]['Salary__c'];
        //   } else if (this.viewResdata[i]['operand'] === 'Gross Service' && this.viewResdata[i]['operandSubOption'] === 'All') {
        //     this.viewResdata[i]['result'] = item.grossService;
        //   } else if (this.viewResdata[i]['operand'] === 'Gross Service' && this.viewResdata[i]['operandSubOption'] === 'New Clients') {
        //     this.viewResdata[i]['result'] = item.grossService;
        //   } else if (this.viewResdata[i]['operand'] === 'Gross Service' && this.viewResdata[i]['operandSubOption'] === 'Recurring Clients') {
        //     this.viewResdata[i]['result'] = item.grossService;
        //   } else if (this.viewResdata[i]['operand'] === 'Gross Service' && this.viewResdata[i]['operandSubOption'] === 'Booked in-house') {
        //     this.viewResdata[i]['result'] = item.grossService;
        //   } else if (this.viewResdata[i]['operand'] === 'Gross Service' && this.viewResdata[i]['operandSubOption'] === 'Booked Online') {
        //     this.viewResdata[i]['result'] = item.grossService;
        //   } else if (this.viewResdata[i]['operand'] === 'Gross Service' && this.viewResdata[i]['operandSubOption'] === 'Service Rebooked') {
        //     this.viewResdata[i]['result'] = item.rebookedServiceAmount;
        //   } else if (this.viewResdata[i]['operand'] === 'Gross Service' && this.viewResdata[i]['operandSubOption'] === 'Standing Appointments') {
        //     this.viewResdata[i]['result'] = item.grossService;
        //   } else if (this.viewResdata[i]['operand'] === 'Services Performed' && this.viewResdata[i]['operandSubOption'] === 'All') {
        //     this.viewResdata[i]['result'] = item.numberOfServices;
        //   } else if (this.viewResdata[i]['operand'] === 'Services Performed' && this.viewResdata[i]['operandSubOption'] === 'New Clients') {
        //     this.viewResdata[i]['result'] = item.numberOfServices;
        //   } else if (this.viewResdata[i]['operand'] === 'Services Performed' && this.viewResdata[i]['operandSubOption'] === 'Recurring Clients') {
        //     this.viewResdata[i]['result'] = item.numberOfServices;
        //   } else if (this.viewResdata[i]['operand'] === 'Services Performed' && this.viewResdata[i]['operandSubOption'] === 'Booked in-house') {
        //     this.viewResdata[i]['result'] = item.numberOfServices;
        //   } else if (this.viewResdata[i]['operand'] === 'Services Performed' && this.viewResdata[i]['operandSubOption'] === 'Booked Online') {
        //     this.viewResdata[i]['result'] = item.numberOfServices;
        //   } else if (this.viewResdata[i]['operand'] === 'Services Performed' && this.viewResdata[i]['operandSubOption'] === 'Service Rebooked') {
        //     this.viewResdata[i]['result'] = item.rebookedServiceNumber;
        //   } else if (this.viewResdata[i]['operand'] === 'Services Performed' && this.viewResdata[i]['operandSubOption'] === 'Standing Appointments') {
        //     this.viewResdata[i]['result'] = item.numberOfServices;
        //   }
        // }

        //  calculation
        for (let v = 0; v < this.viewResdata.length; v++) {

          // ticket count
          if (this.generateTicketCounts.length > 0) {
            for (let t = 0; t < this.generateTicketCounts.length; t++) {
              if (this.generateTicketCounts[t].workerId === item.workerId) {
                if (this.viewResdata[v].operand === 'Tickets' && this.viewResdata[v].operator === 'Start With') {
                  this.viewResdata[v].ticketNum = this.generateTicketCounts[t].ticketCount;
                  this.viewResdata[v].ticRes = this.generateTicketCounts[t].ticketCount;
                } else if (this.viewResdata[v].operand === 'Tickets') {
                  this.viewResdata[v].ticketNum = this.generateTicketCounts[t].ticketCount;
                }
              }
            }
          }

          // compensation scales
          if (this.viewResdata[v].operand.split(':')[0] === 'scale') {
            this.setupCompMethodService.getscales()
              .subscribe(res => {
                this.scalesData = res['result'];
                this.scalesData.forEach(obj => {
                  if (obj.Id === this.viewResdata[v].operand.split(':')[1]) {
                    this.viewResdata[v].operand = 'scale: ' + obj.Name;
                  }
                });
              },
                error => {
                  const errStatus = JSON.parse(error['_body'])['status'];
                  if (errStatus === '2085' || errStatus === '2071') {
                    if (this.router.url !== '/') {
                      localStorage.setItem('page', this.router.url);
                      this.router.navigate(['/']).then(() => { });
                    }
                  }
                });
          }

          // Gross service
          if (this.viewResdata[v].operand === 'Gross Service') {
            if (this.viewResdata[v].operand === 'Gross Service' && this.viewResdata[v].operandSubOption === 'All') {
              this.viewResdata[v].ticketNum = this.totalGrossServiceAmo;
            } else {
              let serviceamount = 0;
              let guestCharge = 0;
              this.generatServiceSalesByServiceGroup.forEach(element => {
                if (element.workerId === item.workerId) {
                  guestCharge += element.guestCharge;
                  serviceamount += element.serviceAmount;
                  this.viewResdata[v].ticketNum = serviceamount - guestCharge;
                }
              });
            }
          }
          let operandvalue = 0;
          // Salary
          if (this.viewResdata[v].operand === 'Salary') {
            this.viewResdata[v].ticketNum = item.salary;
          } else if (this.viewResdata[v].operand === 'Hourly Wage') {  // Hourly Wage
            this.viewResdata[v].ticketNum = item.hourlyWage;
          } else if (this.viewResdata[v].operand === 'Hours Worked') { // Hours Worked
            this.viewResdata[v].ticketNum = item.regularHours;
            if (item.overtimeHours) {
              this.viewResdata[v].ticketNum = item.regularHours + (Number(item.overtimeHours) * 1.5);
            }
          } else if (this.viewResdata[v].operand === 'Days Worked') { // Days Worked
            this.viewResdata[v].ticketNum = item.daysWorked;
          } else if (this.viewResdata[v].operand === 'Services Performed') {  // Services Performed
            let nbrOfServices = 0;
            this.generatServiceSalesByServiceGroup.forEach(element => {
              if (element.workerId === item.workerId) {
                nbrOfServices += element.numberOfServices ? Number(element.numberOfServices) : 0;
                this.viewResdata[v].ticketNum = nbrOfServices;
              }
            });
          } else if (this.viewResdata[v].operand === 'Gross Retail') {  // Gross Retail
            if (this.viewResdata[v].operand === 'Gross Retail' && this.viewResdata[v].operandSubOption === 'All') {
              // get Retail amount/numbers by product line
              let grossRetail = 0;
              this.generatProductSalesByProductLine.forEach(element => {
                if (element.workerId === item.workerId) {
                  grossRetail += element.productAmount ? Number(element.productAmount) : 0;
                  this.viewResdata[v].ticketNum = grossRetail;
                }
              });
            } else {
              // get Retail amount/numbers by inventory group
              let grossRetail = 0;
              this.generatproductSalesByInventoryGroup.forEach(element => {
                if (element.workerId === item.workerId) {
                  grossRetail += element.productAmount ? Number(element.productAmount) : 0;
                  this.viewResdata[v].ticketNum = grossRetail;
                }
              });
            }
          } else if (this.viewResdata[v].operand === 'Products Sold') { // Products Sold
            if (this.viewResdata[v].operand === 'Products Sold' && this.viewResdata[v].operandSubOption === 'All') {
              // get Retail amount/numbers by product line
              let grossRetail = 0;
              this.generatProductSalesByProductLine.forEach(element => {
                if (element.workerId === item.workerId) {
                  grossRetail += element.numberOfProducts ? Number(element.numberOfProducts) : 0;
                  this.viewResdata[v].ticketNum = grossRetail;
                }
              });
            } else {
              // get Retail amount/numbers by inventory group
              let grossRetail = 0;
              this.generatproductSalesByInventoryGroup.forEach(element => {
                if (element.workerId === item.workerId) {
                  grossRetail += element.numberOfProducts ? Number(element.numberOfProducts) : 0;
                  this.viewResdata[v].ticketNum = grossRetail;
                }
              });
            }
          } else if (this.viewResdata[v].operand === 'Cost of Service Fee') {  // Cost of Service Fee
            let costOfService = 0;
            let nbrOfServices = 0;
            let serviceAmount = 0;
            this.generatServiceSalesByServiceGroup.forEach(element => {
              if (element.workerId === item.workerId) {
                serviceAmount = element.serviceAmount;
                nbrOfServices += element.numberOfServices;
              }
            });
            temp4.forEach(element => {
              if (element.Worker__c === item.workerId) {
                if (element.Service_Fee_Percent__c != null && element.Service_Fee_Percent__c > 0) {
                  costOfService += element.Price__c * element.Service_Fee_Percent__c / 100;
                } else if (element.Service_Fee_Amount__c != null && element.Service_Fee_Amount__c > 0) {
                  costOfService += element.Service_Fee_Amount__c;
                }
              }
            });
            this.viewResdata[v].ticketNum = costOfService;
          } else if (this.viewResdata[v].operand === 'Number') { // Number
            if (this.viewResdata[v].numeral) {
              this.viewResdata[v].ticketNum = this.viewResdata[v].numeral;
            } else {
              this.viewResdata[v].ticketNum = 0;
            }
          } else if (this.viewResdata[v].operand === 'Result of Step') {  // Result of Step
            this.viewResdata[v].ticketNum = this.viewResdata[v].numeral;
            const stepVal = parseInt(this.viewResdata[v].numeral, 10);
            operandvalue = this.viewResdata[(stepVal - 1)].result;
          } else if (this.viewResdata[v].operand === 'Percent') { // Percent
            this.viewResdata[v].ticketNum = this.viewResdata[v].numeral;
          }

          switch (this.viewResdata[v].operator) {
            case ('Start With'):
              this.viewResdata[v]['result'] = this.viewResdata[v].ticketNum;
              if (this.viewResdata[v].operand === 'Result of Step') {
                this.viewResdata[v]['result'] = operandvalue;
              }
              break;
            case ('Add'):
              this.viewResdata[v]['result'] = (parseInt(this.viewResdata[v - 1].result, 10) + Number(this.viewResdata[v].ticketNum));
              if (this.viewResdata[v].operand === 'Result of Step') {
                this.viewResdata[v]['result'] = (parseInt(this.viewResdata[v - 1].result, 10) + operandvalue);
              } else if (this.viewResdata[v].operand === 'Percent') {
                this.viewResdata[v]['result'] = this.viewResdata[v - 1].result + this.viewResdata[v].ticketNum / 100;
              }
              break;
            case ('Multiply By'):
              this.viewResdata[v]['result'] = (parseInt(this.viewResdata[v - 1].result, 10) * this.viewResdata[v].ticketNum);
              if (this.viewResdata[v].operand === 'Result of Step') {
                this.viewResdata[v]['result'] = (parseInt(this.viewResdata[v - 1].result, 10) * operandvalue);
              } else if (this.viewResdata[v].operand === 'Percent') {
                this.viewResdata[v]['result'] = (parseInt(this.viewResdata[v - 1].result, 10) * Number(this.viewResdata[v].ticketNum) / 100);
              }
              break;
            case ('Subtract'):
              this.viewResdata[v]['result'] = this.viewResdata[v - 1].result - this.viewResdata[v].ticketNum;
              if (this.viewResdata[v].operand === 'Result of Step') {
                this.viewResdata[v]['result'] = (parseInt(this.viewResdata[v - 1].result, 10) - operandvalue);
              }
              break;
            case ('Divide By'):
              if (this.viewResdata[v].ticketNum) {
                this.viewResdata[v]['result'] = (parseInt(this.viewResdata[v - 1].result, 10) / this.viewResdata[v].ticketNum);
                if (this.viewResdata[v].operand === 'Result of Step') {
                  this.viewResdata[v]['result'] = (parseInt(this.viewResdata[v - 1].result, 10) / operandvalue);
                } else if (this.viewResdata[v].operand === 'Percent') {
                  this.viewResdata[v]['result'] = (parseInt(this.viewResdata[v - 1].result, 10) / Number(this.viewResdata[v].ticketNum) / 100);
                }
              } else {
                this.viewResdata[v]['result'] = 0;
              }
              break;
            case ('If Less Than'):
              if (this.viewResdata[v].ticketNum < this.viewResdata[v - 1].result) {
                this.viewResdata[v]['result'] = parseInt(this.viewResdata[v].ticketNum, 10);
                if (this.viewResdata[v].operand === 'Result of Step') {
                  this.viewResdata[v]['result'] = operandvalue;
                }
              } else {
                this.viewResdata[v]['result'] = this.viewResdata[v - 1].result;
              }
              break;
            case ('If More Than'):
              if (this.viewResdata[v].ticketNum > this.viewResdata[v - 1].result) {
                this.viewResdata[v]['result'] = parseInt(this.viewResdata[v].ticketNum, 10);
                if (this.viewResdata[v].operand === 'Result of Step') {
                  this.viewResdata[v]['result'] = operandvalue;
                }
              } else {
                this.viewResdata[v]['result'] = this.viewResdata[v - 1].result;
              }
              break;
            default:
              this.viewResdata[v]['result'] = 0.00;
          }
        }
        if (item.extraPay) {          // If Extra Pay
          this.viewResdata.push({
            'operator': 'Add',
            'operand': 'Extra Pay',
            'ticketNum': item.extraPay,
            'result': this.viewResdata[(this.viewResdata.length) - 1].result + item.extraPay
          });
        }
        if (item.deduction) {          // If Deduction
          this.viewResdata.push({
            'operator': 'Subtract',
            'operand': 'Deduction',
            'ticketNum': item.deduction,
            'result': this.viewResdata[(this.viewResdata.length) - 1].result - item.deduction
          });
        }

        this.datePicDis = true;
        this.fullviewSetup = true;
      },
      error => {
        const status = JSON.parse(error['status']);
        const statuscode = JSON.parse(error['_body']).status;
        switch (status) {
          case 500:
            break;
          case 400:
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
