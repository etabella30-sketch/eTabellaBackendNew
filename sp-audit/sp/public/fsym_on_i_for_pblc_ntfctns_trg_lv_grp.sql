CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_ntfctns_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'Notifications',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      264,                                                                                                                                             
                                      
          case when new."nNTid" is null then '' else '"' || replace(replace(cast(new."nNTid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTitle" is null then '' else '"' || replace(replace(cast(new."cTitle" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cMsg" is null then '' else '"' || replace(replace(cast(new."cMsg" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dDate" is null then '' when isfinite(new."dDate") then '"' || to_char(new."dDate", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."cStatus" is null then '' else '"' || replace(replace(cast(new."cStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."isScheduled" is null then '' when new."isScheduled" then '"1"' else '"0"' end||','||
          case when new."cType" is null then '' else '"' || replace(replace(cast(new."cType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."bIsseen" is null then '' when new."bIsseen" then '"1"' else '"0"' end||','||
          case when new."nPresentid" is null then '' else '"' || replace(replace(cast(new."nPresentid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nBundledetailid" is null then '' else '"' || replace(replace(cast(new."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nCaseid" is null then '' else '"' || replace(replace(cast(new."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nDocid" is null then '' else '"' || replace(replace(cast(new."nDocid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nFSid" is null then '' else '"' || replace(replace(cast(new."nFSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUPid" is null then '' else '"' || replace(replace(cast(new."nUPid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nRefuserid" is null then '' else '"' || replace(replace(cast(new."nRefuserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nWebid" is null then '' else '"' || replace(replace(cast(new."nWebid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnBundledetailid" is null then '' else '"' || cast(cast(new."ZnBundledetailid" as numeric) as varchar) || '"' end||','||
          case when new."ZnCaseid" is null then '' else '"' || cast(cast(new."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when new."ZnDocid" is null then '' else '"' || cast(cast(new."ZnDocid" as numeric) as varchar) || '"' end||','||
          case when new."ZnFSid" is null then '' else '"' || cast(cast(new."ZnFSid" as numeric) as varchar) || '"' end||','||
          case when new."ZnNTid" is null then '' else '"' || cast(cast(new."ZnNTid" as numeric) as varchar) || '"' end||','||
          case when new."ZnPresentid" is null then '' else '"' || cast(cast(new."ZnPresentid" as numeric) as varchar) || '"' end||','||
          case when new."ZnRefuserid" is null then '' else '"' || cast(cast(new."ZnRefuserid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUPid" is null then '' else '"' || cast(cast(new."ZnUPid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when new."ZnWebid" is null then '' else '"' || cast(cast(new."ZnWebid" as numeric) as varchar) || '"' end,                                                                                                                                                      
                                      'public_notifications',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
