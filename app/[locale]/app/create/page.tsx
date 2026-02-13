"use client";
import LottieAnimation from "@/components/global/LottieAnimation";
import { Button } from "@/components/ui/button";
import { motion, Variants } from "framer-motion";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import CreatePortfolioModal from "./_components/CreatePortfolioModal";
import cryptoLottie from "./_components/crypto.json";

type Props = {};

const CreatePage = (props: Props) => {
  const tNew = useTranslations("New");

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const typing: Variants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-screen space-y-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.h1 className="text-2xl font-semibold" variants={typing}>
        {tNew("title")}
      </motion.h1>

      <motion.div className="w-64 h-64" variants={fadeInUp}>
        <LottieAnimation animationData={cryptoLottie} speed={0.8} />
      </motion.div>

      <motion.h4 className="text-muted-foreground" variants={fadeInUp}>
        {tNew("description")}
      </motion.h4>

      <motion.div variants={fadeInUp}>
        <CreatePortfolioModal
          triggerButton={
            <Button className="space-x-2">
              <Plus /> {tNew("createPortfolio")}
            </Button>
          }
        />
      </motion.div>
    </motion.div>
  );
};

export default CreatePage;
