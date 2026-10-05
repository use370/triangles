import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ needId: string }>;
  }
) {
  const { needId } = await context.params;

  if (!needId) {
    return NextResponse.json(
      { error: "Missing needId" },
      { status: 400 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data: need, error: needError } =
    await supabase
      .from("needs")
      .select("*")
      .eq("id", needId)
      .single();

  if (needError || !need) {
    return NextResponse.json(
      { error: "Need not found" },
      { status: 404 }
    );
  }

  const { data: profiles, error: profileError } =
    await supabase
      .from("profiles")
      .select(
        "id,full_name,username,avatar_url,skill,role,location,professional_level,verified"
      )
      .neq("id", need.user_id)
      .limit(100);

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 500 }
    );
  }

  const requiredSkill =
    (need.skill || "").toLowerCase().trim();

  const requiredLocation =
    (need.location || "").toLowerCase().trim();

  const matches = (profiles || [])
    .map((profile) => {
      const profileSkill =
        `${profile.skill || ""} ${profile.role || ""}`
          .toLowerCase();

      const profileLocation =
        (profile.location || "").toLowerCase();

      let score = 0;

      if (
        requiredSkill &&
        profileSkill.includes(requiredSkill)
      ) {
        score += 70;
      }

      if (
        requiredLocation &&
        profileLocation.includes(requiredLocation)
      ) {
        score += 20;
      }

      if (profile.verified) {
        score += 5;
      }

      if (
        profile.professional_level ===
        "Senior Professional"
      ) {
        score += 5;
      }

      return {
        ...profile,
        match_score: Math.min(score, 100),
      };
    })
    .filter((profile) => profile.match_score > 0)
    .sort(
      (a, b) => b.match_score - a.match_score
    );

  return NextResponse.json({
    need,
    matches,
  });
}