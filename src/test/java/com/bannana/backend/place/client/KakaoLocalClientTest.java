package com.bannana.backend.place.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.net.Authenticator;
import java.net.CookieHandler;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.concurrent.Executor;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.time.Duration;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;

import org.junit.jupiter.api.Test;

import com.bannana.backend.place.config.KakaoLocalProperties;
import com.bannana.backend.place.exception.PlaceExternalApiException;

class KakaoLocalClientTest {

	@Test
	void buildRequest_usesLngAsXAndLatAsYAndAuthorizationHeader() {
		KakaoLocalClient client = new KakaoLocalClient(
			new FakeHttpClient(200, "{\"documents\":[]}"),
			new KakaoLocalProperties("test-key", 2000, 10)
		);

		HttpRequest request = client.buildRequest("CE7", "test-key", 37.3248, 127.1240);

		assertThat(request.uri().toString())
			.contains("category_group_code=CE7")
			.contains("x=127.124")
			.contains("y=37.3248")
			.contains("radius=2000")
			.contains("size=10")
			.contains("sort=distance");
		assertThat(request.headers().firstValue("Authorization")).contains("KakaoAK test-key");
	}

	@Test
	void searchNearby_throwsWhenApiKeyMissing() {
		KakaoLocalClient client = new KakaoLocalClient(
			new FakeHttpClient(200, "{\"documents\":[]}"),
			new KakaoLocalProperties("", 2000, 10)
		);

		assertThatThrownBy(() -> client.searchNearby("CE7", 37.3248, 127.1240))
			.isInstanceOf(PlaceExternalApiException.class)
			.hasMessage("Kakao REST API key is not configured.");
	}

	@Test
	void searchNearby_throwsWhenExternalApiReturnsUnauthorized() {
		KakaoLocalClient client = new KakaoLocalClient(
			new FakeHttpClient(401, "{\"message\":\"unauthorized\"}"),
			new KakaoLocalProperties("test-key", 2000, 10)
		);

		assertThatThrownBy(() -> client.searchNearby("CE7", 37.3248, 127.1240))
			.isInstanceOf(PlaceExternalApiException.class)
			.hasMessage("Kakao Local API returned non-2xx status: 401");
	}

	private static final class FakeHttpClient extends HttpClient {

		private final int statusCode;
		private final String body;

		private FakeHttpClient(int statusCode, String body) {
			this.statusCode = statusCode;
			this.body = body;
		}

		@Override
		public <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> responseBodyHandler) {
			@SuppressWarnings("unchecked")
			HttpResponse<T> response = (HttpResponse<T>) new FakeHttpResponse(request, statusCode, body);
			return response;
		}

		@Override
		public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request,
			HttpResponse.BodyHandler<T> responseBodyHandler) {
			return CompletableFuture.completedFuture(send(request, responseBodyHandler));
		}

		@Override
		public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request,
			HttpResponse.BodyHandler<T> responseBodyHandler, HttpResponse.PushPromiseHandler<T> pushPromiseHandler) {
			return CompletableFuture.completedFuture(send(request, responseBodyHandler));
		}

		@Override
		public Optional<CookieHandler> cookieHandler() {
			return Optional.empty();
		}

		@Override
		public Optional<Executor> executor() {
			return Optional.empty();
		}

		@Override
		public Optional<Duration> connectTimeout() {
			return Optional.empty();
		}

		@Override
		public Redirect followRedirects() {
			return Redirect.NEVER;
		}

		@Override
		public Optional<ProxySelector> proxy() {
			return Optional.empty();
		}

		@Override
		public SSLContext sslContext() {
			return null;
		}

		@Override
		public SSLParameters sslParameters() {
			return null;
		}

		@Override
		public Optional<Authenticator> authenticator() {
			return Optional.empty();
		}

		@Override
		public Version version() {
			return Version.HTTP_1_1;
		}
	}

	private static final class FakeHttpResponse implements HttpResponse<String> {

		private final HttpRequest request;
		private final int statusCode;
		private final String body;

		private FakeHttpResponse(HttpRequest request, int statusCode, String body) {
			this.request = request;
			this.statusCode = statusCode;
			this.body = body;
		}

		@Override
		public int statusCode() {
			return statusCode;
		}

		@Override
		public HttpRequest request() {
			return request;
		}

		@Override
		public Optional<HttpResponse<String>> previousResponse() {
			return Optional.empty();
		}

		@Override
		public HttpHeaders headers() {
			return HttpHeaders.of(Map.of(), (left, right) -> true);
		}

		@Override
		public String body() {
			return body;
		}

		@Override
		public Optional<javax.net.ssl.SSLSession> sslSession() {
			return Optional.empty();
		}

		@Override
		public URI uri() {
			return request.uri();
		}

		@Override
		public HttpClient.Version version() {
			return HttpClient.Version.HTTP_1_1;
		}
	}
}
