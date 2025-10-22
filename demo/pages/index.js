
import { Geist, Geist_Mono } from "next/font/google";
import React, { useEffect, useRef, useState } from "react";
import useDrivePicker from 'react-nextjs-google-drive-picker';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const GDRIVE_CLIENT_ID = 'Your Googledrive Client ID Here';
const GDRIVE_KEY = 'Your Googledrive key ID Here';
const GDRIVE_APPID = 'Your Googledrive App ID Here';

export default function Home() {
  const [openPicker, authResult] = useDrivePicker();
  const [imgURL, setImageURL] = useState(null);

  const oauthToken = useRef("");

    // google drive
  function handleOpenPicker() {
    openPicker({
      appId: GDRIVE_APPID,
      clientId: GDRIVE_CLIENT_ID,
      developerKey: GDRIVE_KEY,
      viewId: "DOCS",
      showUploadView: false,
      showUploadFolders: false,
      supportDrives: true,
      multiselect: false,
      //        customScopes: ['https://www.googleapis.com/auth/drive.file'],
      callbackFunction: (data) => {
        if (data.action === "cancel") {
          console.log("User clicked cancel/close button");
        }
        if (data.action === "picked") {
          let doc = data.docs[0];
            const url = "https://www.googleapis.com/drive/v3/files/" + doc.id + "?alt=media" + `&access_token=${oauthToken.current}`
            setImageURL(url)
        }
      },
    });
  }

  useEffect(() => {
    if (authResult) {
      oauthToken.current = authResult.access_token;
    }
  }, [authResult]);

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} container p-3 mx-auto lg:px-44 bg-zinc-50 font-sans dark:bg-black`}
    >

            <div className="flex justify-center gap-1 mt-10">
              <button type="button" onClick={() => handleOpenPicker()}
                className="py-2 px-3 text-xs inline-flex font-medium text-gray-500 focus:outline-none bg-white rounded-full border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                <svg className="w-4 h-4 me-2" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                  <path d="M339 314.9L175.4 32h161.2l163.6 282.9H339zm-137.5 23.6L120.9 480h310.5L512 338.5H201.5zM154.1 67.4L0 338.5 80.6 480 237 208.8 154.1 67.4z" /></svg>
                GoogleDrive</button>

            </div>

         {imgURL &&<div className="flex justify-center mt-10 max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <img 
          className="rounded-t-lg"
          src={imgURL}
          alt="Blog cover image"
          width={400}   // Set an appropriate width
          height={250}  // and height
        />
    </div>
     } 

    </div>
  );
}
