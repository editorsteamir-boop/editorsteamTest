import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async (req) => {
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  try {
    const {authority,status,purchase_id}=await req.json();if(!authority||!purchase_id)throw new Error("اطلاعات پرداخت ناقص است.");
    if(String(status||"").toUpperCase()!=="OK")return json({paid:false,error:"پرداخت توسط کاربر لغو شد."},400);
    const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const {data:p,error}=await supabase.from("purchases").select("*").eq("id",purchase_id).single();if(error||!p)throw new Error("خرید پیدا نشد.");
    if(p.status==="paid"){const {data:sec}=await supabase.from("sale_secrets").select("download_url").eq("sale_id",p.sale_id).single();return json({paid:true,ref_id:p.ref_id,download_url:sec?.download_url||""});}
    if(p.authority!==authority)throw new Error("Authority تراکنش معتبر نیست.");const merchant=Deno.env.get("ZARINPAL_MERCHANT_ID");if(!merchant)throw new Error("Merchant ID تنظیم نشده است.");
    const zr=await fetch("https://payment.zarinpal.com/pg/v4/payment/verify.json",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({merchant_id:merchant,amount:p.amount_toman*10,authority})});const z=await zr.json();const code=z?.data?.code;if(code!==100&&code!==101)return json({paid:false,error:z?.errors?.message||`تأیید پرداخت ناموفق بود (${code||"?"})`},400);
    const ref=String(z?.data?.ref_id||p.ref_id||"");await supabase.from("purchases").update({status:"paid",ref_id:ref,paid_at:new Date().toISOString()}).eq("id",purchase_id);const {data:sec}=await supabase.from("sale_secrets").select("download_url").eq("sale_id",p.sale_id).single();return json({paid:true,ref_id:ref,download_url:sec?.download_url||""});
  } catch(e){return json({paid:false,error:e.message||"خطای سرور"},500);}
});