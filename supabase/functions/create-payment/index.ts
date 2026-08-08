import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async (req) => {
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  try {
    const { sale_id } = await req.json(); if (!sale_id) throw new Error("sale_id is required");
    const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const {data:sale,error}=await supabase.from("sale_items").select("sale_id,price_toman,active,item_label").eq("sale_id",sale_id).single();
    if(error||!sale||!sale.active||sale.price_toman<=0) return json({error:"این پروژه برای فروش فعال نیست."},400);
    const merchant=Deno.env.get("ZARINPAL_MERCHANT_ID");if(!merchant)return json({error:"Merchant ID زرین‌پال هنوز روی سرور تنظیم نشده است."},503);
    const {data:purchase,error:pe}=await supabase.from("purchases").insert({sale_id,amount_toman:sale.price_toman,status:"pending"}).select("id").single();if(pe)throw pe;
    const site=(Deno.env.get("SITE_URL")||"").replace(/\/$/,"");
    const callback=`${site}/payment-result.html?purchase=${encodeURIComponent(purchase.id)}`;
    const zr=await fetch("https://payment.zarinpal.com/pg/v4/payment/request.json",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({merchant_id:merchant,amount:sale.price_toman*10,callback_url:callback,description:`EditorsTeam - ${sale.item_label||sale.sale_id}`})});
    const z=await zr.json();const authority=z?.data?.authority;if(!authority)return json({error:z?.errors?.message||"زرین‌پال درخواست پرداخت را نپذیرفت."},502);
    await supabase.from("purchases").update({authority}).eq("id",purchase.id);
    return json({payment_url:`https://www.zarinpal.com/pg/StartPay/${authority}`,purchase_id:purchase.id});
  } catch(e){return json({error:e.message||"خطای سرور"},500);}
});