export const signinUser = async (username: string, password: string) => {
  try {
    const result = await fetch(`/api/users/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    }).then((res) => res.json());
    return result;
  } catch (err) {
    console.error(err);
    return {
      error: err,
    };
  }
};
