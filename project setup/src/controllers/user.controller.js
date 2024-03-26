import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { userName, email, fullName, password } = req.body;
  //   if (fullName.trim() === "") throw new ApiError(400, "Name is required");

  if (
    [fullName, email, fullName, userName, password].some(
      (field) => field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required!");
  } //validation for username, fullname, email, password

  const exisitingUser = User.findOne({
    $or: [{ userName }, { email }],
  }); //validation for existing user

  if (exisitingUser) throw new ApiError(409, "User already exists.");

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required!");
  } //validation for the avatar image

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar image is required!");
  }

  const user = await User.create({
    email,
    password,
    userName: userName.toLowerCase(),
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!userCreated) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, userCreated, "User has been registered successfully")
    );
});

export { registerUser };

/* 
Steps:
1. Get user details (required in userSchema)
2. Validation - check if not empty data is received
3. Check if user already exists - use username or email or both
4. Check if data image (avatar required) exists
5. Upload images to cloudinary
6. create userobject and create entry in DB
7. remove password and refresh token field from response
8. check for user creation
9. return res
*/
