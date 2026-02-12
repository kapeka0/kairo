"use client";
import { useTranslations } from "next-intl";
import Image from "next/image";

import AnimatedUpEntrance from "@/components/ui/framer/AnimatedUpEntrance";
import { Link } from "@/i18n/routing";
import { useTheme } from "next-themes";
import SignInForm from "../_components/SignInForm";

function SignInPage() {
  const tAuth = useTranslations("Auth");
  const { theme } = useTheme();
  return (
    <div className="flex w-full h-full flex-col justify-center items-center space-y-5">
      <Link
        href="/"
        className="flex flex-col items-center justify-center space-y-2 text-center"
      >
        <AnimatedUpEntrance delay={0.2} duration={0.4}>
          <Image
            alt="Kairo"
            className="shrink-0"
            height={80}
            src={
              theme === "light"
                ? "/images/logos/logo-square.svg"
                : "/images/logos/logo-square-light.svg"
            }
            width={80}
          />
        </AnimatedUpEntrance>

        <AnimatedUpEntrance delay={0} duration={0.3}>
          <h1 className="text-3xl font-extrabold">{tAuth("welcome")}</h1>
        </AnimatedUpEntrance>

        <AnimatedUpEntrance delay={0} duration={0.4}>
          <p className="text-sm text-muted-foreground">
            {tAuth("welcomeMessage")}
          </p>
        </AnimatedUpEntrance>
      </Link>
      <SignInForm />

      <p className="text-sm text-muted-foreground text-center">
        {tAuth("noAccount")}{" "}
        <Link className="cursor-pointer text-primary" href="/sign-up">
          {tAuth("signUp")}
        </Link>
      </p>
    </div>
  );
}

export default SignInPage;
