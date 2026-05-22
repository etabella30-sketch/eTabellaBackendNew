CREATE OR REPLACE FUNCTION public.et_signin(parameter json, ref1 refcursor)
 RETURNS SETOF refcursor
 LANGUAGE plpgsql
AS $function$
declare nMasterid UUID;email text;password text;
BEGIN

nMasterid := (parameter ->>'nMasterid')::UUID;
email := parameter ->>'cEmail';

/*
select * from et_signin ('{"email":"rajendra@gmail.com","password":"1234"}','r1');fetch all in "r1";
select * from et_signin ('{"cEmail":"rp06438@gmail.com","password":"123"}','r1');fetch all in "r1";
select * from "UserMaster" 
*/

    
    OPEN ref1 FOR 
    select 1 as msg ,"nUserid","cJwt","cPassword","isAdmin" --,"isAdmin","cFname","cLname","cProfile" 
    from "UserMaster" where upper(trim("cEmail")) = upper(trim(email))  and "cStatus" = 'A'
    ;    
        
    RETURN NEXT ref1;
    
    

     
END;
$function$
