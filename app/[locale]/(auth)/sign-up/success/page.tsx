"use client";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import BuisnessMessage from "@/components/global/BusinessMessage";
import LottieAnimation from "@/components/global/LottieAnimation";
import AnimatedUpEntrance from "@/components/ui/framer/AnimatedUpEntrance";
import MailAnimation from "../../_components/mail.json";

export default function SuccessSignup() {
  const t = useTranslations("Auth");
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <div className="w-full flex justify-center items-center flex-col space-y-5">
      <AnimatedUpEntrance>
        <BuisnessMessage
          title={t("signUpSuccess")}
          message={t("emailSent", { email })}
        >
          <LottieAnimation
            animationData={MailAnimation}
            className="w-48 h-48"
            speed={0.7}
          />
        </BuisnessMessage>
      </AnimatedUpEntrance>
    </div>
  );
}
