CREATE OR REPLACE FUNCTION present.fsym_on_u_for_prsnt_pmdcmnts_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nPDid" is null then '' else '"' || replace(replace(cast(new."nPDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dCreateDt" is null then '' when isfinite(new."dCreateDt") then '"' || to_char(new."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."cType" is null then '' else '"' || replace(replace(cast(new."cType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nSerial" is null then '' else '"' || cast(cast(new."nSerial" as numeric) as varchar) || '"' end||','||
          case when new."isActive" is null then '' when new."isActive" then '"1"' else '"0"' end||','||
          case when new."nPCid" is null then '' else '"' || replace(replace(cast(new."nPCid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nPresentid" is null then '' else '"' || replace(replace(cast(new."nPresentid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nBundledetailid" is null then '' else '"' || replace(replace(cast(new."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnBundledetailid" is null then '' else '"' || cast(cast(new."ZnBundledetailid" as numeric) as varchar) || '"' end||','||
          case when new."ZnPCid" is null then '' else '"' || cast(cast(new."ZnPCid" as numeric) as varchar) || '"' end||','||
          case when new."ZnPDid" is null then '' else '"' || cast(cast(new."ZnPDid" as numeric) as varchar) || '"' end||','||
          case when new."ZnPresentid" is null then '' else '"' || cast(cast(new."ZnPresentid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nPDid" is null then '' else '"' || replace(replace(cast(old."nPDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."cType" is null then '' else '"' || replace(replace(cast(old."cType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nSerial" is null then '' else '"' || cast(cast(old."nSerial" as numeric) as varchar) || '"' end||','||
          case when old."isActive" is null then '' when old."isActive" then '"1"' else '"0"' end||','||
          case when old."nPCid" is null then '' else '"' || replace(replace(cast(old."nPCid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nPresentid" is null then '' else '"' || replace(replace(cast(old."nPresentid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nBundledetailid" is null then '' else '"' || replace(replace(cast(old."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnBundledetailid" is null then '' else '"' || cast(cast(old."ZnBundledetailid" as numeric) as varchar) || '"' end||','||
          case when old."ZnPCid" is null then '' else '"' || cast(cast(old."ZnPCid" as numeric) as varchar) || '"' end||','||
          case when old."ZnPDid" is null then '' else '"' || cast(cast(old."ZnPDid" as numeric) as varchar) || '"' end||','||
          case when old."ZnPresentid" is null then '' else '"' || cast(cast(old."ZnPresentid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'PMDocuments',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      220,                                                                                                                                             
                                      
          case when old."nPDid" is null then '' else '"' || replace(replace(cast(old."nPDid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'present_pmdocuments',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
