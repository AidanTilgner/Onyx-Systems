package main

import (
	"github.com/kataras/iris/v12",
	"fmt"
)

func main() {
	app := iris.Default()
	app.Use(myMiddleware)

	app.Handle("GET", "/", func(ctx iris.Context) {
		ctx.JSON(iris.Map{"message": "Hello World!"})
	})

	app.Handle("POST", "/webook", func(ctx iris.Context) {
		fmt.Println("Response: ", ctx.ReadJSON())
		ctx.JSON("Thanks")
	})

	app.Listen(":5055")
}

func myMiddleware(ctx iris.Context) {
	ctx.WriteString("Hello World!")
	ctx.Next()
}
