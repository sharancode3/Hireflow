import type { JobSeekerProfile, ResumeSettings, ResumeTemplate } from "../types";
import { AtsModernTemplate } from "./templates/AtsModernTemplate";
import { ProfessionalTemplate } from "./templates/ProfessionalTemplate";
import { TechnicalTemplate } from "./templates/TechnicalTemplate";

export function ResumePreview(props: { profile: JobSeekerProfile; template: ResumeTemplate; settings: ResumeSettings }) {
  if (props.template === "CLASSIC") {
    return <ProfessionalTemplate profile={props.profile} settings={props.settings} />;
  }
  if (props.template === "MINIMAL") {
    return <TechnicalTemplate profile={props.profile} settings={props.settings} />;
  }
  return <AtsModernTemplate profile={props.profile} settings={props.settings} />;
}
