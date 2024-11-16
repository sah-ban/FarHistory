import { Button } from "frames.js/next";
import { frames } from "./frames";
import { appURL, formatNumber } from "../utils";

interface State {
  lastFid?: string;
}

const frameHandler = frames(async (ctx) => {
  interface UserData {
    name: string;
    username: string;
    fid: string;
    userCreatedAt:string;
    profileDisplayName: string;
    profileImageUrl: string;
  }
  interface lastFidResponse {
    rFid: string;
  
  }
  let userData: UserData | undefined;
  let lastFid: lastFidResponse = { rFid: "0" }; 

  let error: string | null = null;
  let isLoading = false;

  const fetchUserData = async (fid: string) => {
    isLoading = true;
    try {
      const airstackUrl = `${appURL()}/api/profile?userId=${encodeURIComponent(
        fid
      )}`;
      const airstackResponse = await fetch(airstackUrl);
      if (!airstackResponse.ok) {
        throw new Error(
          `Airstack HTTP error! status: ${airstackResponse.status}`
        );
      }
      const airstackData = await airstackResponse.json();
      if (
        airstackData.userData.Socials.Social &&
        airstackData.userData.Socials.Social.length > 0
      ) {
        const social = airstackData.userData.Socials.Social[0];
        userData = {
          name: social.profileDisplayName || social.profileName || "Unknown",
          username: social.profileName || "unknown",
          fid: social.userId || "N/A",
          userCreatedAt:social.userCreatedAtBlockTimestamp || "N/A",
          profileDisplayName: social.profileDisplayName || "N/A",
          profileImageUrl:
            social.profileImageContentValue?.image?.extraSmall ||
            social.profileImage ||
            "",
        };
      } else {
        throw new Error("No user data found");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      error = (err as Error).message;
    } finally {
      isLoading = false;
    }
  };

  const fetchLastFid = async (fid: string) => {
    try {
      const fidUrl = `${appURL()}/api/lastFID?userId=${encodeURIComponent(
        fid
      )}`;
      const fidResponse = await fetch(fidUrl);
      if (!fidResponse.ok) {
        throw new Error(`Fid HTTP error! status: ${fidResponse.status}`);
      }
      const LFid= await fidResponse.json();
     if (
      LFid.lastFid.Socials.Social &&
      LFid.lastFid.Socials.Social.length > 0
    ) {
      const social = LFid.lastFid.Socials.Social[0];
      lastFid = {
        rFid: social.fid || "N/A"
        
      };
      
    } else {
      throw new Error("No user data found");
    }
    } catch (err) {
      console.error("Error fetching Last Fid:", err);
      error = (err as Error).message;
    }
    
  };

  const extractFid = (url: string): string | null => {
    try {
      const parsedUrl = new URL(url);
      let fid = parsedUrl.searchParams.get("userfid");

      console.log("Extracted FID from URL:", fid);
      return fid;
    } catch (e) {
      console.error("Error parsing URL:", e);
      return null;
    }
  };

  let fid: string | null = null;

  if (ctx.message?.requesterFid) {
    fid = ctx.message.requesterFid.toString();
    console.log("Using requester FID:", fid);
  } else if (ctx.url) {
    fid = extractFid(ctx.url.toString());
    console.log("Extracted FID from URL:", fid);
  } else {
    console.log("No ctx.url available");
  }

  if (!fid && (ctx.state as State)?.lastFid) {
    fid = (ctx.state as State).lastFid ?? null;
    console.log("Using FID from state:", fid);
  }

  console.log("Final FID used:", fid);

  const shouldFetchData =
    fid && (!userData || (userData as UserData).fid !== fid);

  if (shouldFetchData && fid) {
    await Promise.all([fetchUserData(fid), fetchLastFid(fid)]);
  }

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return day + 'th';
  switch (day % 10) {
    case 1:  return day + 'st';
    case 2:  return day + 'nd';
    case 3:  return day + 'rd';
    default: return day + 'th';
  }
}

let formattedDate: string | null = null;
let timeDifference: string | null = null;

const timestamp = userData?.userCreatedAt;

if (timestamp) {
  const date = new Date(timestamp);  

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  formattedDate = `${getOrdinalSuffix(date.getDate())} ${months[date.getMonth()]} ${date.getFullYear()}`;
  
  const currentDate = new Date();

  let diffYears = currentDate.getFullYear() - date.getFullYear();
  let diffMonths = currentDate.getMonth() - date.getMonth() + (diffYears * 12); // Convert years to months

  if (diffMonths < 0) {
    diffMonths += 12;
    diffYears -= 1;
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
  let diffDays = currentDate.getDate() - date.getDate();
  
  if (diffDays < 0) {
    diffDays += daysInMonth;
  }

  if (diffYears > 0) {
    timeDifference = `${diffYears} year(s), ${diffMonths} month(s), ${diffDays} day(s) ago`;
  } else if (diffMonths > 0) {
    timeDifference = `${diffMonths} month(s), ${diffDays} day(s) ago`;
  } else if (diffDays > 0) {
    timeDifference = `${diffDays} day(s) ago`;
  } else {
    timeDifference = "Today";
  }

  console.log(formattedDate);  
  console.log(timeDifference);
} else {
  console.log("User creation date is not available.");
}

if (formattedDate) {
  console.log("Formatted date is:", formattedDate);
  console.log("Time difference is:", timeDifference);
}
let percent: string | null = null;
percent= (( Number(Number(lastFid?.rFid)-Number(userData?.fid)) / Number((lastFid?.rFid)))*100).toFixed(1);
console.log("Perrcent is:", percent);


  const SplashScreen = () => (
<div tw="flex flex-col w-full h-full bg-[#FFF5EE] text-[#8660cc] font-sans font-bold">
    <div tw="flex items-center m-auto mt-20">
            <img
              src="https://i.imgur.com/I2rEbPF.png"
              alt="Profile"
              tw="w-50 h-50 rounded-lg mr-4"
            />
    </div>
      <div tw="flex text-5xl font-bold m-auto mb-30"><h3>When did you joined Farcaster?</h3></div>

    </div>
  );


  const ScoreScreen = () => {
    return (
      <div tw="flex flex-col w-full h-full bg-[#8660cc] text-[#FFDEAD] font-sans">
      
      <div tw="flex items-center justify-center text-white mt-18">
            <img
              src={userData?.profileImageUrl}
              alt="Profile"
              tw="w-30 h-30 rounded-lg mr-4"
            />
            <div tw="flex flex-col">
              <span tw="flex text-5xl">{userData?.profileDisplayName}</span>
              <span tw="flex text-3xl">@{(userData?.username)}</span>            </div>
       </div>
      
       <div tw="flex flex-col items-center text-5xl mt-7">
     
       <span tw="flex text-4xl">Joined Farcaster on</span>

       <span tw="flex mt-4 ">{formattedDate} </span>

       <span tw="flex mt-3"> {timeDifference}</span>
       <span tw="flex mt-3">{(( Number(Number(lastFid?.rFid)-Number(userData?.fid)) / Number((lastFid?.rFid)))*100).toFixed(1)}% users joined after you</span>

       </div>
       <span tw="flex text-2xl text-[#000000] mt-4 ml-5">Latest registered FID: {lastFid?.rFid} </span>

       <div tw="flex bg-[#FFDEAD] mt-1 text-black w-full justify-end ">
          <div tw="flex text-3xl pr-20">frame by @cashlessman.eth</div>
        
        </div>
      </div>
    );
  };
  const shareText1 = encodeURIComponent(
    `Check when you joined Farcaster \n \nframe by @cashlessman.eth`
);


const shareText2 = encodeURIComponent(
  `I joined Farcaster on ${formattedDate} which was ${timeDifference}. \nSince then, ${percent}%25 of users have joined after me\nframe by @cashlessman.eth`
);

  const shareUrl1 = `https://warpcast.com/~/compose?text=${shareText1}&embeds[]=https://moxiedemo.vercel.app/frames`;

  const shareUrl2 = `https://warpcast.com/~/compose?text=${shareText2}&embeds[]=https://moxiedemo.vercel.app/frames${
    fid ? `?userfid=${fid}` : ""
  }`;


  const buttons = [];

  if (!userData) {
    buttons.push(
      <Button action="post" target={{ href: `${appURL()}?userfid=${fid}` }}>
        Check Me
      </Button>,
      <Button
        action="link"
        target={shareUrl1}      >
        Share
      </Button>,
      <Button
        action="link"
        target="https://warpcast.com/cashlessman.eth"
      >
        Builder 👤
      </Button>
    );
  } else {
    buttons.push(
      <Button action="post" target={{ href: `${appURL()}?userfid=${fid}` }}>
        Check Me
      </Button>,
      <Button action="link" target={shareUrl2}>
        Share
      </Button>,
         <Button
         action="link"
         target="https://warpcast.com/cashlessman.eth"
         >
        Builder 👤
       </Button>
      
    );
  }

  return {
    image: fid && !error ? <ScoreScreen /> : <SplashScreen /> ,
    buttons: buttons,
  };
});

export const GET = frameHandler;
export const POST = frameHandler;
