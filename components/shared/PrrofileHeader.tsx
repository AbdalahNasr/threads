import Image from "next/image";

interface Props {
  accountId: string;
  authUserId: string;
  name: string;
  username: string;
  imgUrl: string | undefined;
  bio: string | undefined;
  type?: "User" | "Community";
}

const ProfileHeader = ({
  accountId,
  authUserId,
  name,
  username,
  imgUrl,
  bio,
  type,
}: Props) => {
  // Default image if imgUrl is undefined
  const imageUrl = imgUrl || "/assets/user.svg";

  return (
    <div className="flex w-full flex-col justify-start">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-20 w-20 object-cover">
            <Image
              src={imageUrl}
              alt="ProfileImage"
              fill
              className="rounded-full object-cover shadow-2x1"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-left text-heading-3-bold text-light-1">
              {name}
            </h2>
            <p className="text-base-medium text-gray-1">@{username}</p>
          </div>
        </div>
      </div>
      {/* Todo COMMUNITY */}
      {bio && (
        <p className="mt-6 max-w-lg text-base-regular text-light-2">{bio}</p>
      )}
      <div className="mt-12 h-0.5 w-full bg-dark-3" />
    </div>
  );
};

export default ProfileHeader;
