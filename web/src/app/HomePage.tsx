import { Hero } from "@/components/home/Hero";
import { AnnouncementMarquee } from "@/components/home/AnnouncementMarquee";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { SurveyCampaigns } from "@/components/home/SurveyCampaigns";
import { CommunityGallery } from "@/components/home/CommunityGallery";
import { ChurchInfo } from "@/components/home/ChurchInfo";

export default function HomePage() {
  return (
    <>
      <Hero />
      <AnnouncementMarquee />
      <UpcomingEvents />
      <SurveyCampaigns />
      <CommunityGallery />
      <ChurchInfo />
    </>
  );
}
