let request = require("request");
let ch = require("cheerio");
let xlsx = require("xlsx");
let fs = require("fs");
let path = require("path");

let url = "https://www.espncricinfo.com/series/ipl-2020-21-1210595";

request(url , MainPageUrlCB);

function MainPageUrlCB(err,res,body){

    if(err){
        console.log("Wrong URL");
    } else {

        let st = ch.load(body);
        let ScorePageURL = st("a[data-hover = 'View All Results']").attr("href");
        
        request("https://www.espncricinfo.com" + ScorePageURL,allMatch);
    
    }
}

function allMatch(err,res,body){
    
    if(err){
        console.log("Wrong URL");
    } else {
        
        let st = ch.load(body);
        let allMatchURL = st("a[data-hover = 'Scorecard']"); 
        // console.log(allMatchURL.length);
        for(let i = 0 ; i < allMatchURL.length ; i++){

            let href = st(allMatchURL[i]).attr("href");
            let fullURL = "https://www.espncricinfo.com" + href ;
            // console.log(fullURL);
            request(fullURL,allMatchPage);
        }
    }
}

function allMatchPage(err,res,body){
    console.log("-------------------------------------------------------------------------------------------------------------------------------");
    if(err){
        console.log("Wrong URL");
    } else {
        
        let st = ch.load(body);
        let batsmanTable = st(".table.batsman");
        // console.log(batsmanTable.length);

        let teamsName = st(".name-link>p");

        for(let i = 0 ; i < batsmanTable.length ; i++){
            
            let teamName = st(teamsName[i]).text().trim();
            let allRows = st(batsmanTable[i]).find("tbody tr");

            for(let j = 0 ; j < allRows.length - 2 ; j++){

                let cols = st(allRows[j]).find("td");
                let isBatsManRow = st(cols[0]).hasClass("batsman-cell");

                if(isBatsManRow == true){

                    let pname = st(cols[0]).text().trim();
                    let runs = st(cols[2]).text().trim();
                    let balls = st(cols[3]).text().trim();
                    let fours = st(cols[5]).text().trim();
                    let sixes = st(cols[6]).text().trim();
                    let sr = st(cols[7]).text().trim();
                    console.log(pname + " ,runs -> " + runs + " ,balls -> " + balls + " ,fours -> " + fours + " ,sixes -> " + sixes + " ,sr -> " + sr + " played for " + teamName);
                    player(pname,runs,balls,fours,sixes,sr,teamName);
                }
            }         
        }
    }
}

function player(pname,runs,balls,fours,sixes,sr,teamName){

    iplFolderPath = "IPL";

    let isPresent = fs.existsSync(iplFolderPath);

    if(isPresent != true){
        fs.mkdirSync(iplFolderPath);
    }

    let teamFolderPath = path.join(iplFolderPath,teamName);
    let isTeamFolder = fs.existsSync(teamFolderPath);

    if(isTeamFolder != true){
        fs.mkdirSync(teamFolderPath);
    }

    let parr = [];
    
    let pMatchStats = {
        Team:teamName,
        Name:pname,
        Runs:runs,
        Balls:balls,
        Fours:fours,
        Sixes:sixes,
        Sr:sr
    }

    parr.push(pMatchStats);

    let playerFilePath = path.join(teamFolderPath,pname+".xlsx");
    isplayerFilexists = fs.existsSync(playerFilePath);
    
    if(isplayerFilexists != true){
        // let content = JSON.stringify(parr);
        // fs.writeFileSync(playerFilePath,content);

            //create file
            parr = [pMatchStats];
    } else {
           parr = excelReader(playerFilePath,pname);
           parr.push(pMatchStats);
    //     let content = fs.readFileSync(playerFilePath);
    //     let jsonData = JSON.parse(content);
        
    //     jsonData.push(pMatchStats);
    //     let jsonWriteAble = JSON.stringify(jsonData);
        
    //     fs.writeFileSync(playerFilePath,jsonWriteAble);
    }
    excelWriter(playerFilePath,parr,pname);
}

function excelReader(filePath,name){
    if(!fs.existsSync(filePath)){
        return null;
    }
    else{
        // workbook =>excel
        let wt = xlsx.readFile(filePath);
        //get data from notebook
        let excelData = wt.Sheets[name];
        // convert excel format to json => array of obj
        let ans = xlsx.utils.sheet_to_json(excelData);
        return ans;

    }

}

function excelWriter(filePath,json,name){
    // console.log(xlsx.readFile(filePath));
    let newWB = xlsx.utils.book_new();
    //console.log(json);
    let newWS = xlsx.utils.json_to_sheet(json);
    xlsx.utils.book_append_sheet(newWB,newWS,name);
    // file => create , replace
    xlsx.writeFile(newWB,filePath);
}