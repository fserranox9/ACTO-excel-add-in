
/****************************************************************************************
 * 
 *                --------- AgencyDetails Class ----------------
 *    Builds a single employer with its multiple rate plans associated with it.
 *    Column indexes correspond to the import_rate_plan_info range. 
 * 
 ****************************************************************************************/

class AgencyDetails{

  constructor(p_name, p_cid){
    this.name = p_name;
    this.cid = p_cid;
    this.rateplans = [];
    this.allplanlist = [];
  }
  
  getRatePlans(data){
    for (let row = 0; row < data.length; row++){
      if (row > 0 && data[row][0] !=""){
        this.allplanlist.push({
          VRP: data[row][0],
          ERName: data[row][1],
          RPName: data[row][2],
          CountyName: data[row][3],
          ActuaryName: data[row][4],
          RiskPoolID: data[row][5],
          CalPERSID: data[row][6],
        });
      }


        if (this.cid == data[row][6]) 
        {
          vrp = data[row][0];
          vrpname = data[row][2];
          actuaryname = data[row][4];
          riskpool = data[row][5];

          this.rateplans.push({
            Rate_Plan_Id : vrp,
            Rate_Plan_Name : vrpname,
            Actuary_Name : actuaryname,
            Risk_Pool : riskpool
          });
        }
    }

  }

}

/****************************************************************************************
 * 
 *                --------- AssumptionDetails Class ----------------
 *    Builds details about the assumption currently being used in the wb.
 *    parameters are coming from the control tab
 * 
 ****************************************************************************************/

class AssumptionDetails{

  constructor(p_vy, p_interest, p_salarygrowth){
    this.year = p_vy;
    this.valuationyear = "06/30/" + p_vy;
    this.i = Number(p_interest);
    this.s = Number(p_salarygrowth);
  }

}

/****************************************************************************************
 * 
 *                --------- TableStructure Class ----------------
 *   
 * 
 ****************************************************************************************/

class TableStructure {

  constructor(oAgency, oAssumptions, pTableNameID, pDataSource, aFieldCodes, aFormatCodes, aVisibilityCodes, aERTotalRowCodes){
    this.TableNameId = pTableNameID;
    this.DataSource = pDataSource;
    this.FieldCodes = aFieldCodes;
    this.FormatCodes = aFormatCodes;
    this.VisibilityCodes = aVisibilityCodes;
    this.ERTotalRowCodes = aERTotalRowCodes;
    this.FieldNames = [];
    this.ERTotalRowValues = [];
    this.SumTotalValues = [];
    this.VRPValues = [];
    this.getFieldNames(oAgency);
    this.getVRPValues(oAgency, oAssumptions);
    this.getSumTotalvalues();
    this.getERTotalRowValues();
  }

  getFieldNames(oAgency){
    const colMax = this.DataSource[0].length;
    this.FieldCodes.forEach(fincode =>{
      let tmp_fieldname = fincode;
      for ( let col = 0; col < colMax; col++){
        if (fincode == this.DataSource[1][col]){  //assumes the fin code row is the second row in the range. ok for now, may need to param
          tmp_fieldname = this.DataSource[0][col];
          break;
        }
      }
    this.FieldNames.push(tmp_fieldname);
    });
  }

  getVRPValues(oAgency, oAssumptions){

    const rowMax = this.DataSource.length;
    const colMax = this.DataSource[0].length;

    this.FieldCodes.forEach(fincode =>{
      let tmp_vrpvalues = [];
      Object.keys(oAgency.rateplans).forEach(key => {
        let vrp = oAgency.rateplans[key].Rate_Plan_Id;
        for (let row = 0; row < rowMax; row++) {
          if (vrp == this.DataSource[row][2]) {     //assumes the vrp list column is the 3rd column of the range. ok for now, may need to param
            for ( let col = 0; col < colMax; col++){
              if (fincode == this.DataSource[1][col]){   //assumes the fin code row is the second row in the range. ok for now, may need to param
                tmp_vrpvalues.push({ Rate_Plan_Id : vrp, RP_FinCode : fincode, RP_Value : this.DataSource[row][col]});
              }
            }
          }
        }
      });
      if (!tmp_vrpvalues.length){ //handles if no fincode is matched
        Object.keys(oAgency.rateplans).forEach(key => {
        tmp_vrpvalues.push({ Rate_Plan_Id : 0, RP_FinCode : 0, RP_Value : 0});
        });
      };  
      this.VRPValues.push(tmp_vrpvalues);
    });

  }

  getSumTotalvalues(){

    for( let f = 0; f < this.FieldCodes.length; f++){
      let fsum = 0;
      for( let v = 0; v < this.VRPValues[0].length; v++){
        fsum = fsum + Number(this.VRPValues[f][v].RP_Value);
      }
      this.SumTotalValues.push(fsum);
    }

  }

  getERTotalRowValues(){

    for( let f = 0; f < this.FieldCodes.length; f++){
      if (this.ERTotalRowCodes[f] == "SUM" ){
        this.ERTotalRowValues.push(this.SumTotalValues[f]);
      }
      else if (this.ERTotalRowCodes[f] == "N/A" ){
        this.ERTotalRowValues.push("N/A");
      }
      else if (this.ERTotalRowCodes[f] == "NULL" ){
        this.ERTotalRowValues.push("");
      }
      else{
        retval = eval(this.ERTotalRowCodes[f]);
        this.ERTotalRowValues.push(retval);
        this.SumTotalValues[f] = retval;    //the ERTotal and SUMTotal will be the same
      }
    }
  }

  RatioOfSums(val1, val2){ 
    if(this.SumTotalValues[this.FieldNames.indexOf(val2)] == 0 || this.SumTotalValues[this.FieldNames.indexOf(val2)] == "")
    {return 0}
    return this.SumTotalValues[this.FieldNames.indexOf(val1)] / this.SumTotalValues[this.FieldNames.indexOf(val2)];
  }

  SumOfTotals(val1, val2){ 
    return this.SumTotalValues[this.FieldNames.indexOf(val1)] + this.SumTotalValues[this.FieldNames.indexOf(val2)];
  }  

  SumOfProducts(val1, val2){

    let sum = 0;
    for(let v = 0; v < this.VRPValues[0].length; v++)
    {
      sum = sum + (this.VRPValues[this.FieldNames.indexOf(val1)][v].RP_Value * this.VRPValues[this.FieldNames.indexOf(val2)][v].RP_Value);
    }
    return sum;

  }
  
}

/****************************************************************************************
 * 
 *                --------- Office OnReady! ----------------
 *    Main Point of entry. 
 * 
 ****************************************************************************************/

Office.onReady(() =>{
  
});

Office.initialize = () => {
  document.getElementById("buttonFreshStart").onclick = readFSPanel;
  document.getElementById("reLoad").onclick = function() {FetchExcelData(); getAmortSummary();}
  document.getElementById("buttonResetFS").onclick = getAmortSummary;
  // Add the event handler.
  Excel.run(async context => {
    let sheet = context.workbook.worksheets.getItem("calcs_current_rate_plan");
    sheet.onChanged.add(onChange);

    await context.sync();
    console.log("A handler has been registered for the onChanged event.");
  });
};

/**
 * Handle the changed event from the worksheet.
 *
 * @param event The event information from Excel
 */
async function onChange(event) {
    await Excel.run(async (context) => {    
        await context.sync();
        VRPTrigger(event);
  });
}

/****************************************************************************************
 * 
 *                --------- VRPTrigger ----------------
 *    Catches the event in which the rpid named range in excel has changed.
 *    If triggred then initiates other functions to begin
 *    This is where other calls can be initiated
 * 
 ****************************************************************************************/

async function VRPTrigger(event) {

  await Excel.run(async (context) => {

  const sheetER = context.workbook.worksheets.getItem("calcs_current_rate_plan");

  const vrpId = sheetER.getRange("rpid");

  vrpId.load("address, values");

  await context.sync();    
  
  // get VRP location in workbook
  const vrpRngLoc = vrpId.address.slice(vrpId.address.indexOf("!") + 1);

  if (event.address == vrpRngLoc )
  {
      console.log(`Event: Cell-Address: ${event.address}  Type: ${event.changeType}  Source: ${event.source}`)     
      FetchExcelData();
      getAmortSummary();
  }
  
  })
}

/****************************************************************************************
 * 
 *                --------- FetchExcelData ----------------
 *    Will read data from excel and load it. After loading the data, the process of
 *    building the content begins.
 *    ?? reconsider loading data only on workbook open? rather refreshing every VRPtrigger?
 * 
 ****************************************************************************************/

async function FetchExcelData(){
  
  await Excel.run(async (context) => {

    const sheetRPfinancingAll = context.workbook.worksheets.getItem("export_rp_financing_all");
    const sheetPostRPfinancing = context.workbook.worksheets.getItem("export_post_rp_financing");
    const sheetCalcsCurRP = context.workbook.worksheets.getItem("calcs_current_rate_plan");
    const sheetRPinfo = context.workbook.worksheets.getItem("import_rate_plan_info");
    const sheetControl = context.workbook.worksheets.getItem("control");
    const sheetPEPRAEe = context.workbook.worksheets.getItem("PEPRA_EE_Rates");

    const exl_RPfinancingAll = sheetRPfinancingAll.getRange("A3:NM3000");
    const exl_PostRPfinancing = sheetPostRPfinancing.getRange("A3:N3000");
    const exl_RPinfo = sheetRPinfo.getRange("B2:I3000");
    const exl_PEPRAEe = sheetPEPRAEe.getRange("B3:M50"); 

    const exl_EmployerName = sheetCalcsCurRP.getRange("org");
    const exl_CalpersId = sheetCalcsCurRP.getRange("calpers_id");

    const exl_ValuationYear = sheetControl.getRange("current_year");
    const exl_InterestRate = sheetControl.getRange("interest_rate");
    const exl_PayrollGrowth = sheetControl.getRange("payroll_growth");

    //Financial Data
    exl_RPfinancingAll.load("address, columnCount, rowCount, values");
    exl_PostRPfinancing.load("address, columnCount, rowCount, values");
    exl_RPinfo.load("address, columnCount, rowCount, values");
    exl_PEPRAEe.load("address, columnCount, rowCount, values");

    //Employer Details
    exl_EmployerName.load("values");
    exl_CalpersId.load("values");

    //assumptions
    exl_ValuationYear.load("values");
    exl_InterestRate.load("values");
    exl_PayrollGrowth.load("values");

  await context.sync();  

    //build AgencyDetail class
    const RPinfo = exl_RPinfo.values;
    const Agency = new AgencyDetails(exl_EmployerName.values, exl_CalpersId.values);
    Agency.getRatePlans(RPinfo);
    
   //override instance

    //build AssumptionDetails class
    const Assumptions = new AssumptionDetails(exl_ValuationYear.values, exl_InterestRate.values, exl_PayrollGrowth.values)
    
    // All financial data placed in array
    const Data = [exl_RPfinancingAll.values, exl_PostRPfinancing.values, exl_PEPRAEe.values];

      console.log(`The employer currently loaded is: ${Agency.name} - CID: ${Agency.cid} `) ;
      console.log("The associated rate plans are:"); console.log(Agency.rateplans);
      console.log(`The current Assumptions for Valuation Year: ${Assumptions.valuationyear} - Interest Rate: ${Assumptions.i} - Salary Growth Rate: ${Assumptions.s}`) ;

      LoadInfoToDoc(Agency, Assumptions, RPinfo);

      SummaryTableControl(Agency, Assumptions, Data)
  });

}

/****************************************************************************************
 * 
 *                --------- LoadInfoToDoc ----------------
 *    Transfers over agency and assumptions to the html page  
 * 
 ****************************************************************************************/

function LoadInfoToDoc(oAgency, oAssum){
    
  document.getElementById("idERname").innerHTML = oAgency.name;
  document.getElementById("idERcid").innerHTML = oAgency.cid;
  document.getElementById("idVY").innerHTML = oAssum.valuationyear;

}

/****************************************************************************************
 * 
 *                --------- SummaryTableControl ----------------
 *    This initiates the build for all tables along with its desired behavior and 
 *    description of what the table is.  The common structure is that the first columns 
 *    are the plan name and vrp id fields from the agency object. The common table has VRPs for 
 *    its rows and the financial data as its fields(columns).
 * 
 ****************************************************************************************/

function SummaryTableControl(oAgency, oAssumptions, aData){

  //Break the array of Data.   DataSets
  const DS0 = aData[0];     //export_rp_financing_all
  const DS1 = aData[1];     //export_post_rp_financing
  const DS2 = aData[2];     //PEPRA_EE_Rates

  /* Format Codes
  #1 - Number with commas
  #2 - Percent rounded to 2 decimal
  #3 - number rounded to 2 decimal
  #4 - No formating
  */

   /* Visbility Codes
  #0 - Dont display VRP rows.  Total bottom row will still display
  #1 - Display
  */

   /* ER Total Codes
  N/A - Not Applicable
  SUM - Straight sum of field
  NULL - empty
  RatioOfSums(v1,v2) - stringliteral evaluation. Ratio of field sums v1, v2
  SumOfProducts(v1,v2) - stringliteral evaluation. sum of product of vrp level value v1, v2
  SumOfTotals(v1,v2) - stringliteral evaluation. sum of field sums v1, v2
  */

  // **** -- Sensitivity Analysis Tables -- *****

    // --- Maturity Measures ---
    const TableNameID_MM = "idTblmaturityMeasures";
    const DataSource_MM = DS0;
    const FieldCodes_MM = [786,787,63,66,788,14,16];
    const FormatCodes_MM = [3,3,1,1,1,1,1];
    const VisibilityCodes_MM = [1,1,1,1,1,1,1];
    const ERTotalRowCodes_MM = ["this.RatioOfSums('AL Status 5', 'AL Total')","this.RatioOfSums('# Stat 1', 'Unique Retiree Count')","SUM","SUM","SUM","SUM","SUM"];

    const oTable_MM = new TableStructure(oAgency, oAssumptions, TableNameID_MM, DataSource_MM, FieldCodes_MM, FormatCodes_MM, VisibilityCodes_MM, ERTotalRowCodes_MM)

    // --- Hypothetical Termination ---
    const TableNameID_HT = "idTblHypotheticalTerm";
    const DataSource_HT = DS0;
    const FieldCodes_HT = [689,690,691,692,693,694];;
    const FormatCodes_HT = [1,1,2,1,1,2];
    const VisibilityCodes_HT = [1,1,1,1,1,1];
    const ERTotalRowCodes_HT = ["SUM","SUM","1-this.RatioOfSums('Term - Low UAL', 'Term - Low AL Total')","SUM","SUM","1-this.RatioOfSums('Term - High UAL', 'Term - High AL Total')"];

    const oTable_HT = new TableStructure(oAgency, oAssumptions, TableNameID_HT, DataSource_HT, FieldCodes_HT, FormatCodes_HT, VisibilityCodes_HT, ERTotalRowCodes_HT);   

    // --- Discount Rate Sensitivity ---
    const TableNameID_DR = "idTblDiscountSensitivity";
    const DataSource_DR = DS0;
    const FieldCodes_DR = [626,627,766,767,760,761,615,616,628,629,768,769];
    const FormatCodes_DR = [2,1,1,2,2,1,1,2,2,1,1,2];
    const VisibilityCodes_DR = [1,1,1,1,1,1,1,1,1,1,1,1];
    const ERTotalRowCodes_DR = ["NULL","SUM","SUM","1-this.RatioOfSums('-1% UAL Total', '-1% AL')","NULL","SUM","SUM","1-this.RatioOfSums('UAL(AL-MVA)', '0% AL')","NULL","SUM","SUM","1-this.RatioOfSums('+1% UAL Total', '+1% AL')"];

    const oTable_DR = new TableStructure(oAgency, oAssumptions, TableNameID_DR, DataSource_DR, FieldCodes_DR, FormatCodes_DR, VisibilityCodes_DR, ERTotalRowCodes_DR);  

    // --- Inflation Last Annual Sensitivity ---
    const TableNameID_IL = "idTblInflationSensitivity";
    const DataSource_IL = DS0;
    const FieldCodes_IL = [770,771,772,773,760,761,615,616,774,775,776,777];
    const FormatCodes_IL = [2,1,1,2,2,1,1,2,2,1,1,2];
    const VisibilityCodes_IL = [1,1,1,1,1,1,1,1,1,1,1,1];
    const ERTotalRowCodes_IL= ["NULL","SUM","SUM","1-this.RatioOfSums('-1% UAL Total', '-1% AL')","NULL","SUM","SUM","1-this.RatioOfSums('UAL(AL-MVA)', '0% AL')","NULL","SUM","SUM","1-this.RatioOfSums('+1% UAL Total', '+1% AL')"];

    const oTable_IL = new TableStructure(oAgency, oAssumptions, TableNameID_IL, DataSource_IL, FieldCodes_IL, FormatCodes_IL, VisibilityCodes_IL, ERTotalRowCodes_IL);  

    // --- Mortality Sensitivity ---
    const TableNameID_MS = "idTblMortalitySensitivity";
    const DataSource_MS  = DS0;
    const FieldCodes_MS  = [778,779,780,781,760,761,615,616,782,783,784,785];
    const FormatCodes_MS  = [2,1,1,2,2,1,1,2,2,1,1,2];
    const VisibilityCodes_MS  = [1,1,1,1,1,1,1,1,1,1,1,1];
    const ERTotalRowCodes_MS = ["NULL","SUM","SUM","1-this.RatioOfSums('-10% UAL Total', '-10% AL')","NULL","SUM","SUM","1-this.RatioOfSums('UAL(AL-MVA)', '0% AL')","NULL","SUM","SUM","1-this.RatioOfSums('+10% UAL Total', '+10% AL')"];

    const oTable_MS  = new TableStructure(oAgency, oAssumptions, TableNameID_MS, DataSource_MS, FieldCodes_MS, FormatCodes_MS, VisibilityCodes_MS, ERTotalRowCodes_MS);    
    
    // --- Assets ---
    const TableNameID_MVA = "idTblMVA";
    const DataSource_MVA  = DS0;
    const FieldCodes_MVA  = [563];
    const FormatCodes_MVA  = [1];
    const VisibilityCodes_MVA  = [1];
    const ERTotalRowCodes_MVA = ["SUM"];

    const oTable_MVA  = new TableStructure(oAgency, oAssumptions, TableNameID_MVA, DataSource_MVA, FieldCodes_MVA, FormatCodes_MVA, VisibilityCodes_MVA, ERTotalRowCodes_MVA);    

    // --- LDROM ---
    const TableNameID_LDROM = "idTblLDROM";
    const DataSource_LDROM  = DS0;
    const FieldCodes_LDROM  = [2950,2951,2952,2953,2954,2955,2510];
    const FormatCodes_LDROM  = [1,1,1,1,1,1,1];
    const VisibilityCodes_LDROM  = [1,1,1,1,1,1,1];
    const ERTotalRowCodes_LDROM = ["SUM","SUM","SUM","SUM","SUM","SUM","SUM"]
    const oTable_LDROM  = new TableStructure(oAgency, oAssumptions, TableNameID_LDROM, DataSource_LDROM, FieldCodes_LDROM, FormatCodes_LDROM, VisibilityCodes_LDROM, ERTotalRowCodes_LDROM);    
    

  // **** -- Projected Contributions Tables -- ***** 
  
    // --- Projections 0 ---
    const TableNameID_P0 = "idTblprojections";
    const DataSource_P0  = DS0;
    const FieldCodes_P0 = [2801,718, 717,636,707,'X'];
    const FormatCodes_P0  = [1,1,1,2,2,2];
    const VisibilityCodes_P0  = [1,1,1,1,1,0];
    const ERTotalRowCodes_P0 = ["SUM","SUM","SUM","this.RatioOfSums('UAL Payment $','Payroll Projection Yr 3')",`this.RatioOfSums("Plan's Net ER NC $","Payroll Projection Yr 3")`, `this.SumOfTotals("Plan's Net ER NC %","UAL% 50-1")`];

    const oTable_P0  = new TableStructure(oAgency, oAssumptions, TableNameID_P0, DataSource_P0, FieldCodes_P0, FormatCodes_P0, VisibilityCodes_P0, ERTotalRowCodes_P0);    
    
    // --- Projections 1 ---
    const TableNameID_P1 = "idTblprojections1";
    const DataSource_P1  = DS0;
    const FieldCodes_P1 = [2802,631, 'X', 637, 630, 'Y']; 
    const FormatCodes_P1  = [1,1,1,2,2,2,2];
    const VisibilityCodes_P1  = [1,1,0,1,1,0];
    const ERTotalRowCodes_P1 = ["SUM","SUM","this.SumOfProducts('Payroll Projection Yr 4','Proj ERNC%')","this.RatioOfSums('UAL$ 50-1','Payroll Projection Yr 4')", "this.RatioOfSums('X','Payroll Projection Yr 4')", `this.SumOfTotals("UAL% 50-2","Proj ERNC%")`];

    const oTable_P1  = new TableStructure(oAgency, oAssumptions, TableNameID_P1, DataSource_P1, FieldCodes_P1, FormatCodes_P1, VisibilityCodes_P1, ERTotalRowCodes_P1);    
    
    // --- Projections 2 ---
    const TableNameID_P2 = "idTblprojections2";
    const DataSource_P2  = DS0;
    const FieldCodes_P2 = [2803,632, 'X', 638, 731, 'Y']; 
    const FormatCodes_P2  = [1,1,1,2,2,2,2];
    const VisibilityCodes_P2  = [1,1,0,1,1,0];
    const ERTotalRowCodes_P2 = ["SUM","SUM","this.SumOfProducts('Payroll Projection Yr 5','NC% 50-2')","this.RatioOfSums('UAL$ 50-2','Payroll Projection Yr 5')", "this.RatioOfSums('X','Payroll Projection Yr 5')", `this.SumOfTotals("UAL% 50-3","NC% 50-2")`];

    const oTable_P2  = new TableStructure(oAgency, oAssumptions, TableNameID_P2, DataSource_P2, FieldCodes_P2, FormatCodes_P2, VisibilityCodes_P2, ERTotalRowCodes_P2);    

    // --- Projections 3 ---
    const TableNameID_P3 = "idTblprojections3";
    const DataSource_P3  = DS0;
    const FieldCodes_P3 = [2804,633, 'X', 639, 732, 'Y']; 
    const FormatCodes_P3  = [1,1,1,2,2,2,2];
    const VisibilityCodes_P3  = [1,1,0,1,1,0];
    const ERTotalRowCodes_P3 = ["SUM","SUM","this.SumOfProducts('Payroll Projection Yr 6','NC% 50-3')","this.RatioOfSums('UAL$ 50-3','Payroll Projection Yr 6')", "this.RatioOfSums('X','Payroll Projection Yr 6')", `this.SumOfTotals("UAL% 50-4","NC% 50-3")`];

    const oTable_P3  = new TableStructure(oAgency, oAssumptions, TableNameID_P3, DataSource_P3, FieldCodes_P3, FormatCodes_P3, VisibilityCodes_P3, ERTotalRowCodes_P3);    

    // --- Projections 4 ---
    const TableNameID_P4 = "idTblprojections4";
    const DataSource_P4  = DS0;
    const FieldCodes_P4 = [2805,634, 'X', 640, 733, 'Y']; 
    const FormatCodes_P4  = [1,1,1,2,2,2,2];
    const VisibilityCodes_P4  = [1,1,0,1,1,0];
    const ERTotalRowCodes_P4 = ["SUM","SUM","this.SumOfProducts('Payroll Projection Yr 7','NC% 50-4')","this.RatioOfSums('UAL$ 50-4','Payroll Projection Yr 7')", "this.RatioOfSums('X','Payroll Projection Yr 7')", `this.SumOfTotals("UAL% 50-5","NC% 50-4")`];

    const oTable_P4  = new TableStructure(oAgency, oAssumptions, TableNameID_P4, DataSource_P4, FieldCodes_P4, FormatCodes_P4, VisibilityCodes_P4, ERTotalRowCodes_P4);    


    // --- Projections 5 ---
    const TableNameID_P5 = "idTblprojections5";
    const DataSource_P5  = DS0;
    const FieldCodes_P5 = [2806,635, 'X',640, 734, 'Z']; 
    const FormatCodes_P5  = [1,1,1,2,2,2,2];
    const VisibilityCodes_P5  = [1,1,0,0,1,0];
    const ERTotalRowCodes_P5 = ["SUM","SUM","this.SumOfProducts('Payroll Projection Yr 8','NC% 50-5')","this.RatioOfSums('UAL$ 50-5','Payroll Projection Yr 8')", "this.RatioOfSums('X','Payroll Projection Yr 8')", `this.SumOfTotals("UAL% 50-5","NC% 50-5")`];

    const oTable_P5  = new TableStructure(oAgency, oAssumptions, TableNameID_P5, DataSource_P5, FieldCodes_P5, FormatCodes_P5, VisibilityCodes_P5, ERTotalRowCodes_P5);    
    

    // --- Projections 6 ---
    const TableNameID_P6 = "idTblprojections6";
    const DataSource_P6  = DS0;
    const FieldCodes_P6 = [2807,752, 'X',640 , 734, 'Z']; 
    const FormatCodes_P6  = [1,1,1,2,2,2,2];
    const VisibilityCodes_P6  = [1,1,0,0,1,0];
    const ERTotalRowCodes_P6 = ["SUM","SUM","this.SumOfProducts('Payroll Projection Yr 9','NC% 50-5')","this.RatioOfSums('UAL$ 50-6','Payroll Projection Yr 9')", "this.RatioOfSums('X','Payroll Projection Yr 9')", `this.SumOfTotals("UAL% 50-5","NC% 50-5")`];

    const oTable_P6  = new TableStructure(oAgency, oAssumptions, TableNameID_P6, DataSource_P6, FieldCodes_P6, FormatCodes_P6, VisibilityCodes_P6, ERTotalRowCodes_P6);    


  DataTableToHTML(oTable_MM, oAgency);
  DataTableToHTML(oTable_HT, oAgency);
  DataTableToHTML(oTable_DR, oAgency);
  DataTableToHTML(oTable_IL, oAgency);
  DataTableToHTML(oTable_MS, oAgency);
  DataTableToHTML(oTable_MVA, oAgency);
  DataTableToHTML(oTable_LDROM, oAgency);
  DataTableToHTML(oTable_P0, oAgency);
  DataTableToHTML(oTable_P1, oAgency);
  DataTableToHTML(oTable_P2, oAgency);
  DataTableToHTML(oTable_P3, oAgency);
  DataTableToHTML(oTable_P4, oAgency);
  DataTableToHTML(oTable_P5, oAgency);
  DataTableToHTML(oTable_P6, oAgency);
}

/****************************************************************************************
 * 
 *                --------- DataTableToHTML ----------------
 *    Transfers the table structure into a table in the HTML document.
 *    Formats and appends the the rateplanname and VRPid to the first 2 cols.
 * 
 ****************************************************************************************/

function DataTableToHTML(oTable, oAgency){

  let tableBody = document.getElementById(oTable.TableNameId).getElementsByTagName('tbody')[0];
  let tableFoot= document.getElementById(oTable.TableNameId).getElementsByTagName('tfoot')[0];
  while(tableBody.rows.length > 0) tableBody.deleteRow(0);
  while(tableFoot.rows.length > 0) tableFoot.deleteRow(0);

  for (let vrp = 0; vrp < oAgency.rateplans.length; vrp++)
  {
    var row = tableBody.insertRow(-1);

    var cellPlanName = row.insertCell(-1);
    cellPlanName.innerHTML = oAgency.rateplans[vrp].Rate_Plan_Name;
    var cellPlanID = row.insertCell(-1);
    cellPlanID.innerHTML = oAgency.rateplans[vrp].Rate_Plan_Id;

    for(let fcode = 0; fcode < oTable.FieldCodes.length; fcode++) 
    {
      var cellVal = row.insertCell(-1);

      let formatCode = Number(oTable.FormatCodes[fcode]);
      let visibleCode = Number(oTable.VisibilityCodes[fcode]);

      let FormatVisible = formatCode * visibleCode;

      var result = oTable.VRPValues[fcode][vrp].RP_Value;
      cellVal.innerHTML = result;

      switch (FormatVisible){
        case 0:
          cellVal.innerHTML = "";
          break;
        case 1:
          cellVal.innerHTML = result.toLocaleString("en-US");
          break;
        case 2:
          cellVal.innerHTML = Number(result).toLocaleString(undefined,{style: 'percent', minimumFractionDigits:2}); 
          break;
        case 3:
          if ( result != "" ){
            cellVal.innerHTML = Number(result).toFixed(2);
          }
          else{
            cellVal.innerHTML = "N/A";
          }
          break;
        case 4:
          cellVal.innerHTML = result; 
          break;
      }

    }
  }

  var rowF = tableFoot.insertRow(-1);
  let cellER = rowF.insertCell(-1);
  cellER.colSpan = "2";
  cellER.innerHTML = "Employer Total:"

  for(let fcode = 0; fcode < oTable.FieldCodes.length; fcode++) 
  {

    let formatCode = Number(oTable.FormatCodes[fcode]);
    let result = oTable.ERTotalRowValues[fcode]
    let cellf = rowF.insertCell(-1);

    switch (formatCode){
      case 0:
        cellf.innerHTML = result;
        break;
      case 1:
        if ( result != "" ){
          result = Number(result).toFixed(0);
          cellf.innerHTML = Number(result).toLocaleString("en-US");
        }
        else{
          cellf.innerHTML = "N/A";
        }
        break;
      case 2:
        if ( result != "" ){
        cellf.innerHTML = Number(result).toLocaleString(undefined,{style: 'percent', minimumFractionDigits:2}); 
        }
        else{
          cellf.innerHTML = "N/A";
        }      
        break;
      case 3:
        if ( result != "" ){
          cellf.innerHTML = Number(result).toFixed(2);
        }
        else{
          cellf.innerHTML = "N/A";
        }
        break;
      case 4:
        cellf.innerHTML = result; 
        break; 
    }
  }

}


/****************************************************************************************
 * 
 *                --------- Amort Code ----------------
 * 
 ****************************************************************************************/


// BarChartData class definition
//const globalDataUAL = {
  class ChartDataUAL {
    constructor() {
      this.data = [];
    }
    // Method to append new datasets
    addData(plan, planAmortSch, planColor, planBorderColor) {
      var objData = {
        label: "VRP " + plan,
        data: planAmortSch["Total Payments"].slice(),
        backgroundColor: planColor,
        borderColor: planBorderColor
      };
    
      this.data.push(objData);
      console.log('UAL data has been appended')
    }
    addBalanceData(plan, planAmortSch, planColor, planBorderColor) {
      var objData = {
        label: "VRP " + plan,
        data: planAmortSch["Total Balance"].slice(),
        backgroundColor: planColor,
        borderColor: planBorderColor
      };
    
      this.data.push(objData);
      console.log('UAL data has been appended')
    }
  };
  
  // Global variables for two instances of UAL bar chart data
  let barChartUAL = new ChartDataUAL;
  let barChartUALBalance = new ChartDataUAL;
  let barChartHypUAL = new ChartDataUAL;
  var chart1Canvas = document.getElementById("chartUAL");
  var chart2Canvas = document.getElementById("chartHypUAL");
  var chart1 = chart1Canvas.getContext('2d');
  var chart2 = chart2Canvas.getContext('2d');
  var globalDRate = 0;
  
  
  
  const globalChartBarColors = [
    'rgba(201, 203, 207, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 205, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 99, 132, 0.7)'  
  ];
  
  const globalChartBorderColors = [
    'rgb(54, 162, 235)',
    'rgb(255, 99, 132)',
    'rgb(201, 203, 207)',
    'rgb(255, 159, 64)',
    'rgb(153, 102, 255)',
    'rgb(255, 205, 86)',
    'rgb(75, 192, 192)',
    'rgb(255, 99, 132)' 
  ];
  
 // Add value labels on each element within a stack
 Chart.plugins.register({
  afterDatasetsDraw: function (chart, easing) {
    var ctx = chart.ctx;
    var grandTotal = 0;

    chart.data.labels.forEach(function (label, labelIndex) {
      var total = 0;
      var highestIndex = 0;
      chart.data.datasets.forEach(function (dataset, datasetIndex) {
        var meta = chart.getDatasetMeta(datasetIndex);
        if (!meta.hidden) {
          total += dataset.data[labelIndex];
          highestIndex = datasetIndex
        };
      });
      grandTotal += total;

      // Display total at the top of each category
      var xPos = chart.getDatasetMeta(highestIndex).data[labelIndex]._model.x;
      var yPos = chart.getDatasetMeta(highestIndex).data[labelIndex]._model.y - 5; // Adjust label position as needed
      ctx.save(); // .save and .restore functions are used to save and restore the drawing state before and after rotation
      ctx.translate(xPos, yPos);  // Move the drawing origin to the desired position
      ctx.rotate(-Math.PI / 2); // 90 degree rotate
      ctx.fillStyle = 'black'; // Label text color
      ctx.font = '12px Arial'; // Label font size and family
      ctx.textAlign = 'center';
      ctx.fillText(total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), 0, 0);
      ctx.restore();
    });
    // Grand Total:
    ctx.save();
    ctx.fillStyle = 'black'; // Label text color
    ctx.font = '14px Arial'; // Label font size and family
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`Total Payments: ${grandTotal.toLocaleString()}`, chart.width - 20, 20);
    ctx.restore();
  }
});
  
  //Added 2/8/24
  function renderUALChart(chartName, cDataSet) {
    const ctx = document.getElementById(chartName).getContext('2d');  //move this to async function?
    var xValues = [];
    for (let i = 0; i < cDataSet[0]["data"].length; i++) {
      xValues.push(2024 + i); //parameterize starting year so not hard-coded
    };
    Chart.Legend.prototype.afterFit = function() {
      this.height = this.height + 35;
    };  
    const chartUAL = new Chart(chartName,{
      type: 'bar',
      data: {
          labels: xValues,
          datasets: cDataSet
      },
      options: {
           legend: {
               
           },
          scales: {
            xAxes: [{ stacked: true }],
            yAxes: [{ stacked: true, 
              ticks: { 
                callback: function (value, index, values) {
                  //return '$' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                  return '$' + value.toLocaleString();
                }
              } 
            }]
          },
          tooltips: {
            callbacks: {
              label: function (tooltipItem, data) {
                return '$' + tooltipItem.yLabel.toLocaleString();
              }
            }
          }
      }
  
    });
  
    // Expose  chart globally if to update later
    if (chartName == "chartUAL") {
      window.chartUAL = chartUAL;
    } else if (chartName == "chartHypUAL") {
      window.chartHypUAL = chartUAL;
    }

  }
  
  // Added 1/19/24
  async function getPoolSummary() {
    try {
      await Excel.run(async (context) => {
        // Get the selected range
        let sheetER = context.workbook.worksheets.getItem("calcs_current_rate_plan")
        let sheetFinRslt = context.workbook.worksheets.getItem("export_rp_financing_all")
        //const selectedRange = context.workbook.getSelectedRange();
        const keyColumnIndex = 0;
        const employerCID = sheetER.getRange("calpers_id");
        const employerRslts = sheetFinRslt.getRange("A5:NM3000");
        const employerRsltsKey = sheetFinRslt.getRange("A4:NM4");
        const finRsltCds = [63, 788];
        ////////////////////////////////////////////////////////
        ////////  Financing Result Codes: 
        ////////    63 - Total Active #
        ////////    788 - Total Unique Retiree #
        ////////////////////////////////////////////////////////
  
        // Load the values of the selected range
        employerCID.load("values");
        employerRslts.load("address, columnCount, rowCount, values");
        employerRsltsKey.load("address, columnCount, rowCount, values");
  
        // Run the queued commands to load values
        await context.sync();
  
        // Calculate totals and averages
        var rsltColumnIndex = 0
        const values = employerRslts.values;
  
        // Create lists to store matching rows and columns to sum across
        const matchingRows = [];
        const matchingColumns = [];
  
        // Iterate through the rows and identify matching rows
        for (let row = 0; row < employerRslts.values.length; row++) {
          const key = employerRslts.values[row][keyColumnIndex];
          if (employerCID.values == key) {
            matchingRows.push(row);
          }
        }
  
        // Iterate through the columns and identify matching columns
        for (let col = 3; col < employerRslts.columnCount; col++) {
          const header = employerRsltsKey.values[0][col];
          if (finRsltCds.includes(header)) {
            matchingColumns.push(col);
          }
        }
  
        // Create a dictionary to store totals for each column
        const columnTotals = {};
  
        // Iterate only across the relevant portion of the result range for totals
        for (const col of matchingColumns) {
          // Initialize total for the column if not already present
          const rsltType = Number(employerRsltsKey.values[0][col]);
          columnTotals[rsltType] = columnTotals[rsltType] || 0;
  
          for (const row of matchingRows) {
            if (employerCID.values == employerRslts.values[row][keyColumnIndex]) {
              const numericValue = Number(employerRslts.values[row][col]); //First column is indexed to 0
              if (!isNaN(numericValue)) {
                columnTotals[rsltType] += numericValue;
              //const average = total / (employerRslts.rowCount * employerRslts.columnCount);
              }
            }
          }
        }
  
  
        // Display the summary in a dialog box
        await context.sync();
        console.log(`The summary range address was ${employerRslts.address}.`);
        console.log(`The ER CID was ${employerCID.values}.`);
        //console.log(`rslt type 63: ${columnTotals[63]}`);
        console.log("Column Totals:");
        Object.keys(columnTotals).forEach((rsltType) => {
          console.log(`${rsltType}: ${columnTotals[rsltType]}`);
        });
        
      });
    } catch (error) {
      console.error(error);
    }
  }
  
  // Added 1/25/24
  async function getPlanSummary() {
    try {
      await Excel.run(async (context) => {
        // Get the selected range
        let sheetER = context.workbook.worksheets.getItem("calcs_current_rate_plan")
        let sheetFinRslt = context.workbook.worksheets.getItem("export_rp_financing_all")
        //const selectedRange = context.workbook.getSelectedRange();
        const keyColumnIndex = 0;
        const employerCID = sheetER.getRange("calpers_id");
        const employerRslts = sheetFinRslt.getRange("A5:NM3000");
        const employerRsltsKey = sheetFinRslt.getRange("A4:NM4");
        const finRsltCds = [63, 788];
        ////////////////////////////////////////////////////////
        ////////  Financing Result Codes: 
        ////////    63 - Total Active #
        ////////    788 - Total Unique Retiree #
        ////////////////////////////////////////////////////////
  
        // Load the values of the selected range
        employerCID.load("values");
        employerRslts.load("address, columnCount, rowCount, values");
        employerRsltsKey.load("address, columnCount, rowCount, values");
  
        // Run the queued commands to load values
        await context.sync();
  
        // Calculate totals and averages
        var rsltColumnIndex = 0
        const values = employerRslts.values;
  
        // Create lists to store matching rows and columns to sum across
        const matchingRows = [];
        const matchingColumns = [];
  
        // Iterate through the rows and identify matching rows
        const employerRows = {};
        for (let row = 0; row < employerRslts.values.length; row++) {
          const key = employerRslts.values[row][keyColumnIndex];
          if (employerCID.values == key) {
            matchingRows.push(row);
            employerRows[employerRslts.values[row][2]] = employerRows[employerRslts.values[row][2]] || 0;
          }
        }
  
        // Iterate through the columns and identify matching columns
        for (let col = 3; col < employerRslts.columnCount; col++) {
          const header = employerRsltsKey.values[0][col];
          if (finRsltCds.includes(header)) {
            matchingColumns.push(col);
          }
        }
  
        // Create dictionaries to store totals and values for each column
        const columnTotals = {};
  
        // Iterate only across the relevant portion of the result range for totals
        for (const row of matchingRows) {
          const employerVRP = Number(employerRslts.values[row][2]);
          const rowValues = {};  // Nest within employerRows{}
  
          for (const col of matchingColumns) {
            // Initialize total for the column if not already present
            const rsltType = Number(employerRsltsKey.values[0][col]);
            columnTotals[rsltType] = columnTotals[rsltType] || 0;
            if (employerCID.values == employerRslts.values[row][keyColumnIndex]) {
              const numericValue = Number(employerRslts.values[row][col]); //First column is indexed to 0
              if (!isNaN(numericValue)) {
                columnTotals[rsltType] += numericValue;
                rowValues[rsltType] = numericValue;
              //const average = total / (employerRslts.rowCount * employerRslts.columnCount);
              }
            }
          }
          employerRows[employerVRP] = rowValues;
  
        }
  
  
        // Display the summary in a dialog box
        await context.sync();
        console.log(`The summary range address was ${employerRslts.address}.`);
        console.log(`The ER CID was ${employerCID.values}.`);
        //console.log(`rslt type 63: ${columnTotals[63]}`);
        console.log("Column Totals:");
        Object.keys(columnTotals).forEach((rsltType) => {
          console.log(`Fin Result ${rsltType} Total: ${columnTotals[rsltType]}`);
        });
        Object.keys(employerRows).forEach((key) => {
          Object.keys(employerRows[key]).forEach((inner) => {
            console.log(`VRP ${key}: Fin Result ${inner}: ${employerRows[key][inner]}`);
          });
        });
        console.log(employerRows);
        
      });
    } catch (error) {
      console.error(error);
    }
  }
  
  // Added 1/26/24
  async function getAmortSummary() {
    try {
      await Excel.run(async (context) => {
        // Get the selected range
        let sheetCtrl = context.workbook.worksheets.getItem("control")
        let sheetER = context.workbook.worksheets.getItem("calcs_current_rate_plan")
        let sheetFinRslt = context.workbook.worksheets.getItem("export_rp_financing_all")
        let sheetAmortRslt = context.workbook.worksheets.getItem("export_rp_amort_base_all")
        const keyColumnIndex = 0;  // Column from sheetFinRslt to lookup VRPs under an ER CID
        const keyAmortColumnIndex = 0;  // Column from sheetFinRslt to lookup VRPs under an ER CID
        const employerCID = sheetER.getRange("calpers_id");
        const discountRate = sheetCtrl.getRange("interest_rate");
        const payrollInflRate = sheetCtrl.getRange("payroll_growth");
        const finRslts = sheetFinRslt.getRange("A5:NM3000");
        const finAmortRows = sheetAmortRslt.getRange("C3:W30000");
        const finAmortRowsKey = sheetAmortRslt.getRange("C2:W2");
        const amortRows = {};
  
        ////////////////////////////////////////////////////////
        ////////  Amort Base Columns: 
        ////////    Column C - VAL_RATE_PLAN_IDENTIFIER
        ////////    Column D - VALUATION_YEAR_ID
        ////////    Column E - AMORT_CAUSE_TYPE_CD
        ////////    Column F - AMORT_DESC
        ////////    Column G - AMORT_FUNDING_TYPE_CD
        ////////    Column H - AMORT_PERIOD_TYPE_CD
        ////////    Column I - INITIAL_VALUATION_YEAR_ID
        ////////    Column J - INITIAL_AMORT_PERIOD
        ////////    Column K - INITIAL_RAMP_PERIOD_YRS
        ////////    Column L - INITIAL_AMT
        ////////    Column M - AMORT_PERIOD
        ////////    Column N - VAL_DATE_AMT
        ////////    Column O - VAL_DATE1_AMT
        ////////    Column P - VAL_DATE2_AMT
        ////////    Column Q - VAL_DATE_PMT
        ////////    Column R - VAL_DATE1_PMT
        ////////    Column S - VAL_DATE2_PMT
        ////////    Column T - PMT_PERCENT  // Can ignore?
        ////////    Column U - RAMP_DIRECTION_TYPE_CD
        ////////    Column V - RAMP_PCNT
        ////////    Column W - RAMP_UP_ONLY_FLAG
        ////////////////////////////////////////////////////////
  
        // Load the values of the selected range
        employerCID.load("values");
        discountRate.load("values");
        payrollInflRate.load("values");
        finRslts.load("address, columnCount, rowCount, values");
        finAmortRows.load("address, columnCount, rowCount, values");
        finAmortRowsKey.load("address, columnCount, rowCount, values");
  
        // Run the queued commands to load values
        await context.sync();
  
        // Calculate totals and averages
        var rsltColumnIndex = 0;
        const values = finRslts.values;
  
        // Create lists to store matching rows and columns to sum across
        const matchingRows = [];
        const matchingColumns = [];
  
        // Iterate through fin result tab to find ER's plans
        const employerRows = {};
        for (let row = 0; row < finRslts.values.length; row++) {
          const key = finRslts.values[row][keyColumnIndex];
          if (employerCID.values == key) {
            employerRows[finRslts.values[row][2]] = employerRows[finRslts.values[row][2]] || 0;
            amortRows[finRslts.values[row][2]] = [];
          }
        }
  
        let employerPlans = [];
        Object.keys(employerRows).forEach((key) => {
          employerPlans.push(key);
        })
        
  
        // Iterate through the amort rows and identify ER's rows within the plans
        for (let row = 0; row < finAmortRows.values.length; row++) {
          const key = finAmortRows.values[row][keyAmortColumnIndex];
          if (key in employerRows) {
            matchingRows.push(row);
          }
        }
  
        // Iterate through the columns and identify matching columns
        for (let col = 0; col < finAmortRows.columnCount; col++) {
          const header = finAmortRowsKey.values[0][col];
          // if (finRsltCds.includes(header)) {
          matchingColumns.push(col);
          // }
        }
  
        // Create dictionaries to store totals and values for each column
        const columnTotals = {};
  
        // Iterate only across the relevant portion of the result range for totals
        for (const row of matchingRows) {
          const employerVRP = Number(finAmortRows.values[row][0]);
          const rowValues = {};  // Nest within employerRows{}
  
          for (const col of matchingColumns) {
            // Initialize total for the column if not already present
            const rsltType = finAmortRowsKey.values[0][col];
            columnTotals[rsltType] = columnTotals[rsltType] || 0;
            const numericValue = Number(finAmortRows.values[row][col]); //First column is indexed to 0
            if (!isNaN(numericValue)) {
              columnTotals[rsltType] += numericValue;
            }
            rowValues[rsltType] = finAmortRows.values[row][col];
          }
          amortRows[employerVRP].push(rowValues);
        }
  
  
        // Display the summary in a dialog box
        await context.sync();
        console.log(`The summary range address was ${finAmortRows.address}.`);
        console.log(`The ER CID was ${employerCID.values}.`);
        console.log(columnTotals);
        console.log(amortRows);
        const dRate = Number(discountRate.values[0]);
        globalDRate = Number(dRate);
        const pRate = Number(payrollInflRate.values[0]);
        var amortSch = getAmortTotal(amortRows, dRate, pRate);
        amortSch = getUpdSchedule(amortSch, dRate, pRate); // Checks for negative balances at the end of a schedule and simulates single year Fresh Start
  
        // Update the chart ///////////////////////////////////////////////////////////////////////////////////////////
        console.log("The updated ER amort schedules are:");
        console.log(amortSch);
        barChartUAL.data.splice(0); // Clear the data set first
        let i = 0;
        Object.keys(amortSch).forEach((key) => {
          barChartUAL.addData(key, amortSch[key], globalChartBarColors[i % 7], globalChartBorderColors[i % 7]); // Currently set to cycle between 7 colors
          i = i + 1;
        })
        barChartUALBalance.data.splice(0); // Clear the data set first
        // Store balance data for use in fresh starts
        i = 0;
        Object.keys(amortSch).forEach((key) => {
          barChartUALBalance.addBalanceData(key, amortSch[key], globalChartBarColors[i % 7], globalChartBorderColors[i % 7]); // Currently set to cycle between 7 colors
          i = i + 1;
        })
        replaceCanvas("chartContainer1","chartUAL");
        chart1.clearRect(0, 0, chart1Canvas.width, chart1Canvas.height);
        renderUALChart("chartUAL", barChartUAL.data);
        barChartHypUAL.data.splice(0); // Clear the data set first
        i = 0;
        Object.keys(amortSch).forEach((key) => {
          barChartHypUAL.addData(key, amortSch[key], globalChartBarColors[i % 7], globalChartBorderColors[i % 7]); // Currently set to cycle between 7 colors
          i = i + 1;
        })
        replaceCanvas("chartContainer2","chartHypUAL");
        chart2.clearRect(0, 0, chart2Canvas.width, chart2Canvas.height);    
        renderUALChart("chartHypUAL", barChartHypUAL.data);
        
        populateFSPanel();
        // renderUALChart("chartHypUAL", chart2.data);
        // //chart2.update();
        // //chart2.ctx.restore();
      });
    } catch (error) {
      console.error(error);
    }
  }
  
  // Added 2/1/24  --  Array of specified length filled with 0's
  function createProjArray(len) {
    return new Array(len).fill(0);
  }
  
  // Added 1/31/24
  function getAmortTotal(amortRows, dRate, payInflRate) {
    try {
      ////////////////////////////////////////////////////////
      ////////  Amort Base Columns: 
      ////////    Column C - VAL_RATE_PLAN_IDENTIFIER
      ////////    Column D - VALUATION_YEAR_ID
      ////////    Column E - AMORT_CAUSE_TYPE_CD
      ////////    Column F - AMORT_DESC
      ////////    Column G - AMORT_FUNDING_TYPE_CD
      ////////    Column H - AMORT_PERIOD_TYPE_CD
      ////////    Column I - INITIAL_VALUATION_YEAR_ID
      ////////    Column J - INITIAL_AMORT_PERIOD
      ////////    Column K - INITIAL_RAMP_PERIOD_YRS
      ////////    Column L - INITIAL_AMT
      ////////    Column M - AMORT_PERIOD
      ////////    Column N - VAL_DATE_AMT
      ////////    Column O - VAL_DATE1_AMT
      ////////    Column P - VAL_DATE2_AMT
      ////////    Column Q - VAL_DATE_PMT
      ////////    Column R - VAL_DATE1_PMT
      ////////    Column S - VAL_DATE2_PMT
      ////////    Column T - PMT_PERCENT  // Can ignore?
      ////////    Column U - RAMP_DIRECTION_TYPE_CD
      ////////    Column V - RAMP_PCNT
      ////////    Column W - RAMP_UP_ONLY_FLAG
      ////////////////////////////////////////////////////////
  
  
      // Create object for storing plan amort balances and payments
      const plans = {};
  
      // Iterate only across the relevant portion of the result range for totals
      Object.keys(amortRows).forEach((ratePlan) => {
        var planDtls = {'Total Balance': createProjArray(30), 'Total Payments': createProjArray(30)};  
        const amortList = amortRows[ratePlan];
        //console.log(amortList);
  
        for (const j in amortList) {
          // roll forward balance and payment across each amort row
          const amortBase = amortList[j]
          var baseDtls = {'Total Balance': createProjArray(30), 'Total Payments': createProjArray(30)};
          for (let i = 0; i < Math.max(Number(amortBase['AMORT_PERIOD']), 0); i++) {
            if (i == 0) {
              baseDtls['Total Balance'][i] = amortBase['VAL_DATE2_AMT']; // Start at rate-setting year, NOT val date
              baseDtls['Total Payments'][i] = amortBase['VAL_DATE2_PMT']; // Start at rate-setting year, NOT val date
            } else {
              var iPrime = dRate; // Default to level-dollar funding type
              if (amortBase['AMORT_FUNDING_TYPE_CD'] == '002') { // Use level-percent of pay if applicable
                iPrime = ((1 + dRate) / (1 + payInflRate)) - 1;
              }
              const numericValueBal = Math.round(Number(baseDtls['Total Balance'][i - 1]) * (1 + dRate) - Number(baseDtls['Total Payments'][i - 1]) * Math.pow(1 + dRate, 0.5));
              const numericValuePmt = Math.round(dRSPmt(iPrime,Number(amortBase['INITIAL_AMORT_PERIOD']),Number(amortBase['AMORT_PERIOD']) - i,Number(amortBase['INITIAL_RAMP_PERIOD_YRS']),numericValueBal * Math.pow(1 + dRate, 0.5),Number(amortBase['RAMP_UP_ONLY_FLAG'])));
              if (!isNaN(numericValueBal)) {
                baseDtls['Total Balance'][i] = numericValueBal;
              }
              if (!isNaN(numericValuePmt)) {
                baseDtls['Total Payments'][i] = numericValuePmt;
              }
            }
            // Add on the base's amounts to the plans total for that year
            planDtls['Total Balance'][i] += baseDtls['Total Balance'][i];
            planDtls['Total Payments'][i] += baseDtls['Total Payments'][i];
          }
          //console.log(amortBase); // Uncomment for debugging
          //console.log(baseDtls); // Uncomment for debugging
        }
        // Now that the plan is processed, store results before moving to next plan
        // Still need to check if end of schedule needs altering for negative balance
        plans[ratePlan] = plans[ratePlan] || planDtls;
      });
  
  
      // Display the summary in a dialog box
      console.log("The original ER amort schedules are:");
      console.log(plans);
      return plans;
    } catch (error) {
      console.error(error);
    }
  }
  
  // Added 2/2/24
  function getUpdSchedule(origSchedule, dRate, payInflRate) {
    try {
      // Iterate only across the relevant portion of the result range for totals
      var amortSchedule = origSchedule;
  
      Object.keys(amortSchedule).forEach((ratePlan) => {
        var planBalances = amortSchedule[ratePlan]['Total Balance'];
        var planPayments = amortSchedule[ratePlan]['Total Payments'];
  
        // Start evaluation at index 1 (after rate-setting year) since payment for prior year has already been evaluated by financing
        var setZero = false;
        for (let i = 1; i < 30; i++) {
          if (setZero) {
            planBalances[i] = 0;
            planPayments[i] = 0;
          } else {
            if (Number(planBalances[i]) < 0) {
              planPayments[i-1] = Math.round(Number(planBalances[i-1]) * Math.pow(1 + dRate, 0.5));
              planBalances[i] = 0;
              planPayments[i] = 0;
              setZero = true;
            }
          }
        };
        
        // Now that the plan is processed, store results before moving to next plan
        amortSchedule[ratePlan]['Total Balance'] = amortSchedule[ratePlan]['Total Balance'] || planBalances;
        amortSchedule[ratePlan]['Total Payments'] = amortSchedule[ratePlan]['Total Payments'] || planPayments;
      });
  
      // Display the summary in a dialog box
      //console.log("The updated ER amort schedules are:");
      //console.log(amortSchedule);
      return amortSchedule;
    } catch (error) {
      console.error(error);
    }
  }
  
  // Added 2/13/24
  function freshStartSchedule(begBalance, dRate, period) {
    try {
      var planBalances = createProjArray(30);
      var planPayments = createProjArray(30);
  
      planBalances[0] = Number(begBalance);
      planPayments[0] = Math.round(dRSPmt(Number(dRate), Number(period), Number(period), 1, Number(planBalances[0]) * Math.pow(1 + Number(dRate), 0.5), 0));
  
      // Start evaluation at index 1 (after rate-setting year)
      // Iterate only across the relevant portion of the result range for totals
      for (let i = 1; i < Number(period); i++) {
        planBalances[i] = Math.round(Number(planBalances[i-1]) * (1 + dRate) - Number(planPayments[i-1]) * Math.pow(1 + dRate, 0.5));
        planPayments[i] = Math.round(dRSPmt(Number(dRate),Number(period),Number(period) - i,1,planBalances[i] * Math.pow(1 + dRate, 0.5),0));
      };
  
      return planPayments;
    } catch (error) {
      console.error(error);
    }
  }
  
  // Function to get rate plan and FS period for simulation
  async function inputFS(selectedPlan, selectedPeriod) {
    try {
  
      // Get the selected values from the dropdowns asynchronously
      //var selectedPlan = document.getElementById("dropdownPlanin").value;
      //var selectedPeriod = document.getElementById("dropdownPeriodin").value;
  
      console.log(selectedPlan);
      console.log(selectedPeriod);
      // Start building the payment schedule
      // Update the chart ///////////////////////////////////////////////////////////////////////////////////////////
      for (let i = 0; i < barChartHypUAL["data"].length; i++) {
        if (barChartHypUAL["data"][i]["label"] == selectedPlan) {
          var hypArray = [];
          // Assumes barChartUALBalance corresponds to same ordering as barChartHypUAL
          hypArray = freshStartSchedule(Number(barChartUALBalance["data"][i]["data"][0]), globalDRate, selectedPeriod); //Currently grabbing first payment, needs to grab beginning balance
          barChartHypUAL["data"][i]["data"].splice(0, 30);
          barChartHypUAL["data"][i]["data"].unshift(...hypArray);
        }
      }
      //chart2.clearRect(0, 0, chart2Canvas.width, chart2Canvas.height);    
      //renderUALChart("chartHypUAL", barChartHypUAL.data);
      window.chartHypUAL.update();

    } catch (error) {
      console.error(error);
    }
  }

  function dropDPopulate(valueArray) {
    var dropdownElement = document.getElementById("dropdownPlan");
    // Clear existing options
    dropdownElement.innerHTML = "";
    // Populate dropdown with options
    for (let i = 0; i < valueArray.length; i++) {
      var option = document.createElement("option");
      option.value = valueArray[i];
      option.text = valueArray[i];
      dropdownElement.appendChild(option);
    }
  }
  
  function getSelectedDropD(dropDown) {
    return new Promise((resolve, reject) => {
      // Assuming dropdown has an id attribute set to "dropdown"
      var dropdownElement = document.getElementById(dropDown);
  
      // Check if the element is found
      if (dropdownElement) {
        // Get the selected value
        var selectedValue = dropdownElement.value;
  
        // Resolve the promise with the selected value
        resolve(selectedValue);
      } else {
        // Reject the promise with an error
        reject(new Error("Dropdown element not found"));
      }
    });
  }

  
  // Brute force clear any charts in the container
  function replaceCanvas(containerName, canvasName) {
    const container = document.getElementById(containerName);
    const oldCanvas = document.getElementById(canvasName);
    container.removeChild(oldCanvas);
 
    const newCanvas = document.createElement("canvas");
    newCanvas.id = canvasName
    container.appendChild(newCanvas);
 
  }

  // Update FS panel with chart data
  function populateFSPanel() {
    const infoBox = document.getElementById('panelFS');
    let content = '<h3>Fresh Start Summary</h3>';

    for (let i = 0; i < barChartHypUAL["data"].length; i++) {
      content += `<p><strong>${barChartHypUAL["data"][i]["label"]}</strong>:  `;
      content += `<select class="labelPeriod" id="dropdownPeriodin${i}">
                    <option value="">Select from 1-20</option>
                    ${generateFSOptions()}
                  </select>`;
    }

    infoBox.innerHTML = content;
  }

  function generateFSOptions () {
    let options = '';
    for (let i = 1; i <= 20; i++) {
      options += `<option value ="${i}">${i}</option>`;
    }
    return options;
  }

  function readFSPanel() {
    const labelDropdowns = document.querySelectorAll('.labelPeriod');
    const labelSelections = [];

    labelDropdowns.forEach((dropdown) => {
      const labelElement = dropdown.parentElement.querySelector('strong');
      const label = labelElement.innerText;
      const selection = dropdown.value;

      //labelSelections.push({ label, selection});
      console.log(label + "," + selection)
      if (selection != "") {
        inputFS(label,Number(selection));
      }
    });
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////
  // Added 1/29/24 ////////// DRS PAYMENT FUNCTIONS /////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////
  function dRSPmt(rate, origPer, remPer, rampPer, presVal, rampFlag) {
    try {
      var annuityFactor = 0;
      if (rampFlag == 0) {
        annuityFactor = dRSPresVal(rate, origPer, remPer, rampPer, 1)
        if (annuityFactor == 0) {
          return 0;
        } else {
          return Math.min(rampPer, origPer - remPer + 1, Math.max(remPer, 0)) * (presVal / annuityFactor);
        }
      } else if (rampFlag == 1) {
        for (let i = 1; i <= Math.max(1, rampPer + remPer - origPer); i++) {
          var x = 1;
          if ( i == 1) {
            x = Math.min(rampPer, origPer - remPer + 1)
          } 
          annuityFactor = annuityFactor + myPresVal(rate, remPer - i + 1, -1, 0, 1) * (Math.pow(1 + rate, 1 - i)) * x; //myPresVal
        }
        if (annuityFactor == 0) {
          return 0;
        } else {
          return presVal / annuityFactor * Math.min(rampPer, origPer - remPer + 1);
        }
      } else {
        return 0;
      }
    } catch (error) {
      console.error(error);
    }
  }
  
  function dRSPresVal(rate, origPer, remPer, rampPer, pmt) {
    try {
      const step = Math.min(origPer - remPer, origPer - rampPer);
      const numRampDowns = Math.min(rampPer, step, Math.max(remPer, 0));
      const rampUp = myPresVal(rate, origPer - rampPer + 1, -1, 0, 1) * myPresVal(rate, Math.max(rampPer - step, 0), -1, 0, 1);
      var rampDown = 0;
      if (numRampDowns > 0) {
        for(let i = 1; i <= numRampDowns; i++) {
          rampDown = rampDown + myPresVal(rate, origPer - rampPer - step + i, -1, 0, 1);
        }
      }
      return (rampUp + rampDown) * pmt;
    } catch (error) {
      console.error(error);
    }
  }
  
  function myPresVal(rate, nPer, pmt, futVal, beg) {
    try {
      return -(pmt * (1 + rate * beg) * ((Math.pow(1 + rate, nPer) - 1) / rate) + futVal) * (1 / Math.pow(1 + rate, nPer))
    } catch (error) {
      console.error(error);
    }
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////