  function statusCellStyle(autoStatusNum){
    var cellStyle = 'greenStyle';
    if(autoStatusNum == -1 || autoStatusNum == 0 || autoStatusNum == 4
       || autoStatusNum == 5 || autoStatusNum == 8) {
      cellStyle = 'redStyle';
    } else if(autoStatusNum == 1 || autoStatusNum == 2) {
      cellStyle = 'orangeStyle';
    } else if(autoStatusNum == 3 || autoStatusNum == 6 || autoStatusNum == 7) {
      cellStyle = 'greenStyle';
    }
     
    return cellStyle;
  }
  
  function sortByProperty(property, sortDirection) {

    sortDirection = typeof sortDirection !== 'undefined' ? sortDirection : 1;
    var sortOrder = sortDirection === 'desc' ? -1 : 1;

    return function (a, b) {
      var sortStatus = 0;
      if (a[property] < b[property]) {
        sortStatus = -1;
      } else if (a[property] > b[property]) {
        sortStatus = 1;
      }

      return sortStatus * sortOrder;
    };
  }
  
  Platform.Load("Core","1.1.1");
  var prox = new Script.Util.WSProxy();
  Array.includes = function(val,arr) {
    var ret = false;
    for(var i=0;i<arr.length;i++){
       if (!ret || ret == false){
         ret = ( val == arr[i] ? true: false );
       }
    }
    return ret;
  }
  
  Array.find = function(val, property, arr) {
    var ret = false;
    var index = -1;
    for(var i=0;i<arr.length;i++){
       if (!ret){
         ret = ( val == arr[i][property] ? true: false );
         //write('<p>' + val + ' ' + arr[i][property] + '</p>');
         index = i;
       }
    }
    
    if(!ret) index = -1;
    
    return index;
  }
  
  var continuar = true;
   
  /* Leer automations a monitorizar de la DE objects_to_monitor */
  var autoFilter = [];
  var automations;
  
  try {
    automations =  Platform.Function.LookupRows('objects_to_monitor', 'ObjectType', 'Automation');
    masterDEs =  Platform.Function.LookupRows('objects_to_monitor', 'ObjectType', 'masterDE');
  } catch(e) {
    Write('<p>Error al obtener los registros de objects_to_monitor: ' + Stringify(e) + '</p>');
    continuar = false;   
  }
   
  /* Poner los automations a monitorizar en el array nameFilter */
 if(continuar){
   try {
     if(automations && automations.length > 0) {
            //Write('<p>Hay automations!</p>');
        for(var i=0; i<automations.length; i++) {
              //Write('<p>Leer automation ' + i + ': ' + automations[i]["Name"] + '</p>');
              autoFilter.push(automations[i]["Name"]);
        }
     }
     //Write(Stringify(nameFilter));
     } catch(e) {
        Write('<p>Error al crear el filtro de automations: ' + Stringify(e) + '</p>');
        continuar = false;

     }
  }

  
  /* Poner los automations a monitorizar en el array nameFilter */
  if(continuar){
    try {
      
    var statusObj = {
        "-1":"Error",
        "0":"BuildingError",
        "1":"Building",
        "2":"Ready",
        "3":"Running",
        "4":"Paused",
        "5":"Stopped",
        "6":"Scheduled",
        "7":"Awaiting Trigger",
        "8":"InactiveTrigger"
     }     
    
    var cols = [ "*", "CustomerKey", "Name", "Status", "LastRunTime", "Notifications" ,"CreatedDate" ];
    var filter = {
        Property: "Status",
        SimpleOperator: "IN",
        Value: [-1,0,1,2,3,4,5,6,7,8]
    }; 
 
    
     var autoRes = prox.retrieve("Automation", cols, filter);
     autoRes.Results.sort(sortByProperty("Name"));
     //Write(Stringify(autoRes.Results));

     Write('<h2><a href="https://mc.s50.exacttarget.com/cloud/#app/Automation%20Studio/AutomationStudioFuel3/">Automations</a></h2>');
      
     if (autoRes.Results.length > 0) {
        //Write('<p>' + Stringify(autoRes.Results) + '</p>');
        var html = '<table class="styled-table" border="1" cellpadding="5" >';
        html += '<thead><tr><th>#' +
              '</th><th>Name' +
              '</th><th> Created Date' +
              '</th><th> Last Run Time' +
              '</th><th> Last Run Error Date' +
              '</th><th> Notification email' +
              '</th><th> Status' +
              '</th></tr></thead> ';
        var j = 1;
        for (var i = 0; i < autoRes.Results.length; i++) {
            var autoName = autoRes.Results[i].Name;
            if(Array.includes(autoName,autoFilter)){
              var autoStatusNum = autoRes.Results[i].Status;
              var autoDateCreate = autoRes.Results[i].CreatedDate;
              var autoStatus = statusObj[autoStatusNum];
              var autoLastRun = autoRes.Results[i].LastRunTime;
              var autoEmail = (autoRes.Results[i].Notifications == null) ? "-" : autoRes.Results[i].Notifications[0].Address; 
              
              var autoCustomerKey = autoRes.Results[i].CustomerKey;
              var autoLastError = "-";
              
              var instanceProx = new Script.Util.WSProxy();
              var instanceCols = ["CustomerKey", "Status", "StartTime", "CompletedTime"];

              var customerKeyFilter = {
                Property:"CustomerKey",
                SimpleOperator:"equals", 
                Value: autoCustomerKey 
              };
              
              var instanceRes = instanceProx.retrieve("AutomationInstance", instanceCols, customerKeyFilter);
              
              var lastErrorColor = 3;
              
              for (var auxResul = 0; auxResul < autoRes.Results.length; auxResul++) {
                 if(instanceRes.Results[auxResul].StatusMessage == "Error") {
                     autoLastError = instanceRes.Results[auxResul].StartTime;
                     lastErrorColor = 0;
                 }
              }
              
              //Write("<p>" + Stringify(instanceRes[finded]) + "</p>" );
              
              html += '<tr><td style="text-align:center;">' + Stringify(j) +
                    '</td><td>' + autoName +
                    /*'<a href="https://mc.s50.exacttarget.com/cloud/#app/Automation%20Studio/AutomationStudioFuel3/%23Instance/b0FGdkFJZ2lVRWVhazRDbGI4SVNJdzoyNTow">' +
                    autoName + '</a> '+ */
                    '</td><td>' + autoDateCreate +
                    '</td><td>' + autoLastRun +
                    '</td><td style="text-align: center;" class="' + statusCellStyle(lastErrorColor) + '">' + autoLastError +
                    '</td><td style="text-align: center;">' + autoEmail +
                    '</td><td class="' + statusCellStyle(autoStatusNum) + '">' + autoStatus +
                    '</td></tr> ';
              j++;
          }
        }
      html += '</table>';
    }
    Write(html);
    
   } catch(e) {
        Write('<p>Error al mostrar los journeys: ' + Stringify(e) + '</p>');
        continuar = false;
     }
  }
  
  //---------------------------------------API REST-----------------------------------------------------------------------------------
     function getJourneyData(journeyId,journeyVersion) {
      try {

        var restBaseURI = 'https://' + getApiSubdomain() + '.rest.marketingcloudapis.com/',
            // a SFMC access token
            token = getAccessToken(),
            prox = new Script.Util.WSProxy();

        // get journey data by id
        return getJourneyByID(journeyId,null,journeyVersion);

      } catch(e) {
        Write('Ha ocurrido un error al intentar obtener los datos del journey con id ' + journeyId + '. Consulte este error con su administrador. </br>');
      }
    }
  
    function getJourneyDE(journeyId,journeyVersion) {
    try {

      var restBaseURI = 'https://' + getApiSubdomain() + '.rest.marketingcloudapis.com/',
          // a SFMC access token
          token = getAccessToken(),
          prox = new Script.Util.WSProxy();

      // get journey data by id
      var journeyData = getJourneyData(journeyId, journeyVersion),
          journeyTriggerEventDefinitionId = journeyData.triggers[0].metaData.eventDefinitionId;
      
      if (journeyTriggerEventDefinitionId) {

        // get triggered EventDefinition data
        var journeyEventDefinition = getJourneyEventDefinitions(journeyTriggerEventDefinitionId),
            journeyTriggerDataExtensionObjectId = journeyEventDefinition.dataExtensionId;

        // get Data Extension Key based on object id
        if (journeyTriggerDataExtensionObjectId) {

          var dataExtension = retrieveDataExtensionByObjectId(journeyTriggerDataExtensionObjectId);

          /*Write(dataExtension.Name);
                      Write(dataExtension.CustomerKey);*/

          return dataExtension.Name;
        }
        return null;
      }
      else if(journeyData == 30003){
        return 30003;
      }

    } catch(e) {
      Write('Ha ocurrido un error al intentar obtener la DE del journey con id ' + journeyId + '. Consulte este error con su administrador. </br>');
    }
  }
  
  function journeyHistoryReturn(page,pageSize) {
     var endPoint = 'https://' + getApiSubdomain() + '.rest.marketingcloudapis.com/' + 'interaction/v1/interactions/journeyhistory/search?$page=' + page + '&$pageSize=' + pageSize;
     var contentType = 'application/json';
     var payload = '';
     var headers = ['Authorization'];
     var headervalues = ["Bearer " + getAccessToken()];
     var body = {
        /*"definitionIds": [
            "06d6f3f6-4532-4fb3-908c-xxxxxxxxxxxx"
        ],*/
        "start": "2019-10-23T12:29:11.882Z",
        "end": null,
        "extras": "all"
     }
     
     //payload += '"start": "2022-08-02T12:29:11.882Z"';

     var results = HTTP.Post(endPoint, contentType, payload, headers, headervalues);

     return results.Response;
  }
  
  function getApiSubdomain(){
    //return  '{{mcpm:RestApiSubDomain}}';
    return  'mcw0x-67whm-qnp7x4lw38wx2xm8'; //demo
  }
  
  function getAccessToken(){
    var MID = Platform.Recipient.GetAttributeValue('memberid');
    //var client_id = '{{mcpm:clientId}}';
    var client_id = 'tovijfsosjo4mmhqxd0z020b'; //demo
    //var client_secret = '{{mcpm:clientSecret}}';
    var client_secret = '4LeUdeZy1KXp83EpoXR2v8QQ'; //demo
    var API_subdomain = getApiSubdomain();
    var contentType = 'application/json';
    var payload = '';
    var accessTokenResult;
    var tokenObj;
    var accessToken;
    var auth;
    var statusCode;
    var result;

    payload = '{"grant_type":"client_credentials",';
    payload += '"client_id":"' + client_id + '",';
    payload += '"client_secret":"' + client_secret + '",';
    //payload += '"scope": "list_and_subscribers_write",';
    payload += '"account_id":"' + MID + '"}';
    
    var OAuth2URL = "https://" + API_subdomain + ".auth.marketingcloudapis.com/v2/token";
    
    try {
      accessTokenResult = HTTP.Post(OAuth2URL, contentType, payload);
      tokenObj = Platform.Function.ParseJSON(accessTokenResult["Response"][0]);
      accessToken = tokenObj.access_token;
      //Write("El token es " + accessToken);
      //auth = ["Bearer " + accessToken];
      //statusCode = accessTokenResult["StatusCode"];
      //Tengo el AccessToken!
      return accessToken;
      
    } catch(e) {
      //Write(Stringify(e));
    } 
  }
  
  /**
         * Retrieves a single journey by ID or key.
         *
         * To call this resource, assign your API Integration the Automation | Interactions | Read scope.
         *
         * @param   {string}    id                  ID of version 1 of the journey in the form of a GUID (UUID).
         *                                          Required if not using a key.
         * @param   {string}    key                 The key of the journey. Required if not using ID. 
         *                                          Prefix the parameter with key:. For example: key:{key}.
         * @param   {number}    [versionNumber]     Version number of the journey to retrieve. If not provided, 
         *                                          version 1 is returned.
         * @param   {string}    [extras]            A list of additional data to fetch. Available values are: 
         *                                          all, activities, outcomes and stats. Default is 'all'.
         *
         * @returns {object}
         *
         * @see {link https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/routes.htm#detail_getInteractionById|getInteractionById}
         *
         * @example
         * // using id
         * var resp = getJourneyByID('DDD4HDX8-34F7-4143-9406-EE916052CEAD');
         * 
         * // using key
         * var resp = getJourneyByID(null,'key:DDD4HDX8-34F7-4143-9406-EE916052CEAD');
         * 
         */
  function getJourneyByID(id,key,versionNumber,extras) {
    var config = {
      url: restBaseURI + "interaction/v1/interactions/",
      contentType: "application/json",
      header: {
        Authorization: "Bearer " + token
      }
    };

    if (!id && !key ) {
      throw '(getJourneyByID)\n\tRequired Parameter missing';
    }

    config.url += (id)?id:key;
    config.url += (versionNumber)?"?versionNumber="+versionNumber:'?versionNumber=1';
    config.url += (extras)?"&extras="+extras:'&extras=all';

    var req = httpRequest('GET',config.url, config.contentType, null, config.header);

    if (req.status == 200) {
      return req.content;
    } else if(req.errorcode == 30003){
      return 30003;
    }
    else {
      throw '(getJourneyByID)\n\tRetrieve Journey failed ' + Stringify(req);
    }

  }
  /**
         * Retrieves a single journey by ID or key.
         *
         * To call this resource, assign your API Integration the Automation | Interactions | Read scope.
         *
         * @param   {string}    id                  ID of version 1 of the journey in the form of a GUID (UUID).
         *                                          Required if not using a key.
         * @param   {string}    key                 The key of the journey. Required if not using ID. 
         *                                          Prefix the parameter with key:. For example: key:{key}.
         * @param   {number}    [versionNumber]     Version number of the journey to retrieve. If not provided, 
         *                                          version 1 is returned.
         * @param   {string}    [extras]            A list of additional data to fetch. Available values are: 
         *                                          all, activities, outcomes and stats. Default is 'all'.
         *
         * @returns {object}
         *
         * @see {link https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/routes.htm#detail_getInteractionById|getInteractionById}
         *
         * @example
         * // using id
         * var resp = getJourneyByID('DDD4HDX8-34F7-4143-9406-EE916052CEAD');
         * 
         * // using key
         * var resp = getJourneyByID(null,'key:DDD4HDX8-34F7-4143-9406-EE916052CEAD');
         * 
         */
  function getJourneyByDefinitionType(definitionType, page, pageSize) {
    var endPoint = 'https://' + getApiSubdomain() + '.rest.marketingcloudapis.com/' + 'interaction/v1/interactions/search?$page=' + page + '&$pageSize=' + pageSize;
     var contentType = 'application/json';
     var payload = '';
     var headers = ['Authorization'];
     var headervalues = ["Bearer " + getAccessToken()];
     var body = {
        /*"definitionIds": [
            "06d6f3f6-4532-4fb3-908c-xxxxxxxxxxxx"
        ],*/
        "definitionType": definitionType
     }
     
     //payload += '"start": "2022-08-02T12:29:11.882Z"';

     var req = HTTP.Post(endPoint, contentType, payload, headers, headervalues);

    if (req.status == 200) {
      return req.content;
    } else if(req.errorcode == 30003){
      return 30003;
    }
    else {
      throw '(getJourneyByDefinitionType)\n\tRetrieve Journey failed ' + Stringify(req);
    }

  }
  /**
         * Retrieves an individual event definition by ID or key.
         *
         * @param   {string}    id                  ID of version 1 of the journey in the form of a GUID (UUID).
         *                                          Required if not using a key.
         * @param   {string}    key                 The key of the journey. Required if not using ID. 
         *
         * @returns {object}
         *
         * @see {link https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/routes.htm#detail_getEventDefinition|getInteractionById}
         *
         * @example
         * // using id
         * var resp = rest.getJourneyEventDefinitions('DDD4HDX8-34F7-4143-9406-EE916052CEAD');
         * 
         * // using key
         * var resp = rest.getJourneyEventDefinitions(null,'key:DDD4HDX8-34F7-4143-9406-EE916052CEAD');
         * 
         */
  function getJourneyEventDefinitions(id,key) {
    var config = {
      url: restBaseURI + "interaction/v1/eventDefinitions/",
      contentType: "application/json",
      header: {
        Authorization: "Bearer " + token
      }
    };

    if (!id && !key ) {
      throw '(getJourneyEventDefinitions)\n\tError: Required Parameter missing';
    }

    config.url += (id)?id:key;

    var req = httpRequest('GET',config.url, config.contentType, null, config.header);

    if (req.status == 200) {
      return req.content;
    } else {
      throw '(getJourneyEventDefinitions)\n\tError: Retrieve Journey Event Definitions failed ' + Stringify(req);
    }

  }
  /**
         * Retrieve informations about a single DataExtension based on the object id.
         * 
         * @param {string}  objectId  The internal identifier for the DataExtension.
         *
         * @returns {object} Result set of the request.
         *
         */
  function retrieveDataExtensionByObjectId(objectId) {
    var cols = retrievableCols('DataExtension'),
        property = ['Name','CustomerKey'],
        req = {};

    var req = prox.retrieve("DataExtension", cols, { 
      Property: 'ObjectId', 
      SimpleOperator: "equals", 
      Value: objectId
    });

    if( req.Status == 'OK' && req.Results.length > 0 ) {
      return req.Results[0];
    }
    throw '(retrieveDataExtensionByObjectId)\n\tError: Cannot find DataExtension with ObjectId: '+objectId;
  }
  /** 
         * Retrieves all retrievable columns for the given object.
         * 
         * @param {string} objectType The SFMC Object to retrieve cols from.
         *
         * @returns {array} A list of al retrievable columns.
         *
         * @example
         * // retrieve cols for DataExtension
         * var cols = retrievableCols('DataExtension');
         *
         * @see {@link https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/getting_the_fields_available_for_retrieval.htm|Get the Fields Available for Retrieval}
         */
  function retrievableCols(objectType) {
    var cols = [];

    var req = prox.describe(objectType);
    var props = req.Results[0].Properties;
    if( props.length > 0 ) {
      for(var i=0; i < props.length; i++) {
        if( props[i].IsRetrievable ) {
          cols.push(props[i].Name);
        }
      }
    }
    return cols;
  }
  /**
         * Perform an HTTP request allowing the usage of API methods.
         *
         * @param {string} method           The method to use e.g: POST, GET, PUT, PATCH, and DELETE
         * @param {string} url              The url to send the request to
         * @param {string} [contentType]    The contentType to use e.g: application/json
         * @param {object} [payload]        A payload for the request body
         * @param {object} [header]         Header values as key value pair
         *
         * @returns {object} Result of the request
         */
  function httpRequest(method,url,contentType,payload,header) {
    var req = new Script.Util.HttpRequest(url);
    req.emptyContentHandling = 0;
    req.retries = 2;
    req.continueOnError = true;
    req.method = method;
    for( var k in header ) {
      req.setHeader(k, header[k]);
    }
    if(typeof contentType !== 'undefined' && contentType !== null) { req.contentType = contentType; }
    if(typeof payload !== 'undefined' && payload !== null) { req.postData = Platform.Function.Stringify(payload); }
    
    //Write(req + "</br>");
    
    try {
      var res = req.send();

      return {
        status: Platform.Function.ParseJSON(String(res.statusCode)),
        content: Platform.Function.ParseJSON(String(res.content))
      };

    } catch(e) {
      return {
        status: '500',
        content: e
      };
    }
  }
